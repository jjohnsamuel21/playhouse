import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { verifyToken, type AuthRequest } from '../middleware/verifyToken';
import { db } from '../firebase-admin';
import type { GameId, ThemeContent, TruthOrDareContent, ThisOrThatContent, RankingContent } from '@games/shared';

const router = Router();
const client = new Anthropic();

// ── Per-game system prompts ───────────────────────────────────────────────────

const SYSTEM_PROMPTS: Partial<Record<GameId, string>> = {
  'truth-or-dare': `You generate Truth or Dare game content.
Output ONLY a raw JSON object — no markdown, no code fences, no explanation, no extra text.
The JSON must match this exact shape:
{"truth":["question1","question2"],"dare":["dare1","dare2"]}
Requirements: at least 15 truths, at least 15 dares, all strings.`,

  'this-or-that': `You generate This or That game content.
Output ONLY a raw JSON object — no markdown, no code fences, no explanation, no extra text.
The JSON must match this exact shape:
{"pairs":[{"a":"option A","b":"option B"},{"a":"option C","b":"option D"}]}
Requirements: at least 20 pairs, each pair has exactly "a" and "b" string fields.`,

  ranking: `You generate Ranking game content.
Output ONLY a raw JSON object — no markdown, no code fences, no explanation, no extra text.
The JSON must match this exact shape:
{"items":["item1","item2","item3"]}
Requirements: between 10 and 20 items, all strings.`,
};

function buildUserPrompt(gameId: GameId, interests: string[], themeName: string): string {
  const interestList = interests.join(', ');
  switch (gameId) {
    case 'truth-or-dare':
      return `Generate a Truth or Dare theme called "${themeName}" based on: ${interestList}. Output raw JSON only.`;
    case 'this-or-that':
      return `Generate a This or That theme called "${themeName}" based on: ${interestList}. Output raw JSON only.`;
    case 'ranking':
      return `Generate a Ranking theme called "${themeName}" based on: ${interestList}. Output raw JSON only.`;
    default:
      throw new Error(`AI generation not supported for gameId: ${gameId}`);
  }
}

// ── JSON extraction — handles markdown fences and surrounding text ─────────────

function extractJSON(raw: string): string {
  const trimmed = raw.trim();

  // Strip ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Find outermost { ... }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);

  return trimmed;
}

// ── Per-game schema validation ────────────────────────────────────────────────

type ValidateResult = { ok: true; content: ThemeContent } | { ok: false; error: string };

function validateTruthOrDare(raw: unknown): ValidateResult {
  if (typeof raw !== 'object' || raw === null) return { ok: false, error: 'Root must be an object' };
  const c = raw as Record<string, unknown>;

  if (!Array.isArray(c.truth)) return { ok: false, error: 'Missing "truth" array' };
  if (!Array.isArray(c.dare)) return { ok: false, error: 'Missing "dare" array' };
  if (c.truth.length < 5) return { ok: false, error: `"truth" has ${c.truth.length} items, need ≥5` };
  if (c.dare.length < 5) return { ok: false, error: `"dare" has ${c.dare.length} items, need ≥5` };
  if (!c.truth.every((v) => typeof v === 'string')) return { ok: false, error: '"truth" items must all be strings' };
  if (!c.dare.every((v) => typeof v === 'string')) return { ok: false, error: '"dare" items must all be strings' };

  return { ok: true, content: { truth: c.truth as string[], dare: c.dare as string[] } satisfies TruthOrDareContent };
}

function validateThisOrThat(raw: unknown): ValidateResult {
  if (typeof raw !== 'object' || raw === null) return { ok: false, error: 'Root must be an object' };
  const c = raw as Record<string, unknown>;

  if (!Array.isArray(c.pairs)) return { ok: false, error: 'Missing "pairs" array' };
  if (c.pairs.length < 5) return { ok: false, error: `"pairs" has ${c.pairs.length} items, need ≥5` };

  // Accept both {a, b} objects and [a, b] tuples from LLM
  const pairs: { a: string; b: string }[] = [];
  for (let i = 0; i < c.pairs.length; i++) {
    const p = c.pairs[i];
    if (Array.isArray(p) && p.length === 2 && typeof p[0] === 'string' && typeof p[1] === 'string') {
      pairs.push({ a: p[0], b: p[1] });
    } else if (p && typeof p === 'object' && typeof (p as Record<string,unknown>).a === 'string' && typeof (p as Record<string,unknown>).b === 'string') {
      pairs.push({ a: (p as { a: string; b: string }).a, b: (p as { a: string; b: string }).b });
    } else {
      return { ok: false, error: `pairs[${i}] must be {a, b} object or [a, b] tuple` };
    }
  }

  return { ok: true, content: { pairs } satisfies ThisOrThatContent };
}

function validateRanking(raw: unknown): ValidateResult {
  if (typeof raw !== 'object' || raw === null) return { ok: false, error: 'Root must be an object' };
  const c = raw as Record<string, unknown>;

  if (!Array.isArray(c.items)) return { ok: false, error: 'Missing "items" array' };
  if (c.items.length < 3) return { ok: false, error: `"items" has ${c.items.length} items, need ≥3` };
  if (!c.items.every((v) => typeof v === 'string')) return { ok: false, error: '"items" must all be strings' };

  return { ok: true, content: { items: c.items as string[] } satisfies RankingContent };
}

const VALIDATORS: Partial<Record<GameId, (raw: unknown) => ValidateResult>> = {
  'truth-or-dare': validateTruthOrDare,
  'this-or-that': validateThisOrThat,
  ranking: validateRanking,
};

// ── Route ─────────────────────────────────────────────────────────────────────

router.post('/', verifyToken, async (req, res) => {
  const { user } = req as AuthRequest;
  const { gameId, interests, visibility, themeName } = req.body as {
    gameId: GameId;
    interests: string[];
    visibility: 'public' | 'private';
    themeName: string;
  };

  if (!SYSTEM_PROMPTS[gameId]) {
    res.status(400).json({ error: `Unknown gameId: ${gameId}` });
    return;
  }

  let rawText = '';

  try {
    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      system: SYSTEM_PROMPTS[gameId],
      messages: [{ role: 'user', content: buildUserPrompt(gameId, interests, themeName) }],
    });

    const message = await stream.finalMessage();
    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      res.status(500).json({ error: 'No text block in LLM response' });
      return;
    }
    rawText = textBlock.text;
  } catch (err) {
    res.status(500).json({ error: 'LLM call failed', detail: String(err) });
    return;
  }

  // Extract JSON from response (handle markdown fences, surrounding text)
  const jsonStr = extractJSON(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    res.status(500).json({
      error: 'LLM returned non-JSON',
      extracted: jsonStr.slice(0, 200),
      raw: rawText.slice(0, 500),
    });
    return;
  }

  // Validate against game-specific schema
  const validator = VALIDATORS[gameId];
  if (!validator) {
    res.status(400).json({ error: `AI generation not supported for gameId: ${gameId}` });
    return;
  }
  const result = validator(parsed);
  if (!result.ok) {
    res.status(500).json({
      error: 'LLM output failed schema validation',
      detail: result.error,
      parsed,
    });
    return;
  }

  const ref = await db.collection('themes').add({
    gameId,
    name: themeName,
    description: `AI-generated theme based on: ${interests.join(', ')}`,
    tags: interests,
    visibility: visibility ?? 'private',
    ownerId: user.uid,
    isLLMGenerated: true,
    content: result.content,
    createdAt: new Date(),
  });

  res.json({ themeId: ref.id, content: result.content });
});

export default router;
