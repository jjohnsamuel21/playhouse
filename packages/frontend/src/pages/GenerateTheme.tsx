import React, { KeyboardEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import type { GameId, TruthOrDareContent, ThisOrThatContent, RankingContent } from '@games/shared';

const GAMES: { id: GameId; label: string; emoji: string }[] = [
  { id: 'truth-or-dare', label: 'Truth or Dare', emoji: '🎲' },
  { id: 'this-or-that', label: 'This or That', emoji: '🔀' },
  { id: 'ranking', label: 'Ranking', emoji: '🏆' },
];

type Step = 'form' | 'generating' | 'preview';

export default function GenerateTheme() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const initialGame = (searchParams.get('gameId') as GameId | null) ?? 'truth-or-dare';

  const [step, setStep] = useState<Step>('form');
  const [gameId, setGameId] = useState<GameId>(initialGame);
  const [themeName, setThemeName] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [error, setError] = useState<string | null>(null);

  // Result
  const [generatedThemeId, setGeneratedThemeId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<unknown>(null);

  function addTag() {
    const tag = tagInput.trim().replace(/,+$/, '');
    if (tag && !interests.includes(tag)) {
      setInterests((prev) => [...prev, tag]);
    }
    setTagInput('');
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && tagInput === '' && interests.length > 0) {
      setInterests((prev) => prev.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    setInterests((prev) => prev.filter((t) => t !== tag));
  }

  async function handleGenerate() {
    if (!themeName.trim()) { setError('Theme name required'); return; }
    if (interests.length === 0) { setError('Add at least one interest'); return; }
    setError(null);
    setStep('generating');

    try {
      const token = await getAuth().currentUser?.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/generate-theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gameId, interests, themeName: themeName.trim(), visibility }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      const data = await res.json() as { themeId: string; content: unknown };
      setGeneratedThemeId(data.themeId);
      setGeneratedContent(data.content);
      setStep('preview');
    } catch (err) {
      setError(String(err));
      setStep('form');
    }
  }

  function playNow() {
    if (!generatedThemeId) return;
    navigate(`/game/${gameId}/local-setup/${generatedThemeId}`);
  }

  // ── Generating screen ───────────────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <div className="page-layer min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-spin inline-block">✨</div>
          <p className="text-lg font-display font-semibold text-playhouse-text-primary">
            Claude is generating your theme…
          </p>
          <p className="text-playhouse-text-secondary text-sm">This takes 15–30 seconds</p>
        </div>
      </div>
    );
  }

  // ── Preview screen ──────────────────────────────────────────────────────────
  if (step === 'preview' && generatedContent) {
    return (
      <div className="page-layer min-h-screen p-6 animate-fadeUp">
        <div className="max-w-lg mx-auto space-y-6">
          <div>
            <span
              onClick={() => navigate(-1)}
              className="text-sm text-playhouse-text-secondary hover:text-playhouse-text-primary cursor-pointer transition-colors"
            >
              ← Back
            </span>
            <div className="flex items-center gap-2 mt-4 mb-1">
              <span className="text-playhouse-accent-primary text-sm font-semibold">✨ AI Generated</span>
              <span className="text-xs bg-white/[0.06] text-playhouse-text-tertiary px-2 py-0.5 rounded-full">
                {visibility}
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl text-playhouse-text-primary">{themeName}</h1>
            <p className="text-playhouse-text-secondary text-sm mt-1">Based on: {interests.join(', ')}</p>
          </div>

          <ContentPreview gameId={gameId} content={generatedContent} />

          <div className="flex gap-3">
            <button
              onClick={playNow}
              className="flex-1 py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#e0479e,#a855f7)' }}
            >
              Play Now
            </button>
            <button
              onClick={() => navigate(`/game/${gameId}/themes`)}
              className="flex-1 py-3 rounded-xl font-semibold border border-white/10 text-playhouse-text-primary hover:bg-white/[0.04] transition-colors"
            >
              Back to Themes
            </button>
          </div>

          <button
            onClick={() => { setStep('form'); setGeneratedThemeId(null); setGeneratedContent(null); }}
            className="w-full text-playhouse-text-tertiary hover:text-playhouse-text-secondary text-sm transition-colors"
          >
            Generate Another
          </button>
        </div>
      </div>
    );
  }

  // ── Form screen ─────────────────────────────────────────────────────────────
  return (
    <div className="page-layer min-h-screen p-6 animate-fadeUp">
      <div className="max-w-lg mx-auto space-y-8">
        <div>
          <span
            onClick={() => navigate(-1)}
            className="text-sm text-playhouse-text-secondary hover:text-playhouse-text-primary cursor-pointer transition-colors"
          >
            ← Back
          </span>
          <h1 className="font-display font-bold text-2xl text-playhouse-text-primary mt-4">
            ✨ Generate with AI
          </h1>
          <p className="text-playhouse-text-secondary text-sm mt-1">
            Claude creates a custom theme based on your interests
          </p>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Game selector */}
        <div className="space-y-2">
          <label className="text-[13px] text-playhouse-text-secondary uppercase tracking-wide">Game</label>
          <div className="grid grid-cols-3 gap-2">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => setGameId(g.id)}
                className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                  gameId === g.id
                    ? 'text-white'
                    : 'bg-playhouse-surface text-playhouse-text-secondary hover:bg-white/[0.04]'
                }`}
                style={gameId === g.id ? { background: 'linear-gradient(135deg,#e0479e,#a855f7)' } : undefined}
              >
                <span className="block text-xl mb-1">{g.emoji}</span>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme name */}
        <div className="space-y-2">
          <label className="text-[13px] text-playhouse-text-secondary uppercase tracking-wide">Theme Name</label>
          <input
            type="text"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            placeholder="e.g. Office Party, Movie Night, Road Trip…"
            className="w-full bg-playhouse-surface border border-white/10 rounded-xl px-4 py-3 text-playhouse-text-primary placeholder:text-playhouse-text-tertiary focus:outline-none focus:border-playhouse-accent-primary transition-colors"
          />
        </div>

        {/* Interests tags */}
        <div className="space-y-2">
          <label className="text-[13px] text-playhouse-text-secondary uppercase tracking-wide">
            Interests / Topics
          </label>
          <div className="bg-playhouse-surface border border-white/10 rounded-xl px-3 py-2 focus-within:border-playhouse-accent-primary transition-colors min-h-[52px] flex flex-wrap gap-2 items-center">
            {interests.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 bg-[rgba(224,71,158,0.14)] text-playhouse-text-primary text-sm px-2 py-1 rounded-lg"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="text-playhouse-accent-primary hover:text-white">×</button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={addTag}
              placeholder={interests.length === 0 ? 'Type an interest, press Enter…' : ''}
              className="flex-1 min-w-[120px] bg-transparent text-playhouse-text-primary placeholder:text-playhouse-text-tertiary focus:outline-none text-sm py-1"
            />
          </div>
          <p className="text-xs text-playhouse-text-tertiary">Press Enter or comma to add each interest</p>
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <label className="text-[13px] text-playhouse-text-secondary uppercase tracking-wide">Visibility</label>
          <div className="grid grid-cols-2 gap-2">
            {(['private', 'public'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                  visibility === v
                    ? 'text-white'
                    : 'bg-playhouse-surface text-playhouse-text-secondary hover:bg-white/[0.04]'
                }`}
                style={visibility === v ? { background: 'linear-gradient(135deg,#e0479e,#a855f7)' } : undefined}
              >
                {v === 'private' ? '🔒 Private' : '🌐 Public'}
              </button>
            ))}
          </div>
          <p className="text-xs text-playhouse-text-tertiary">
            {visibility === 'private' ? 'Only you can see and use this theme' : 'Visible to all players'}
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!themeName.trim() || interests.length === 0}
          className="w-full py-4 rounded-xl font-bold text-lg text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#e0479e,#a855f7)' }}
        >
          Generate Theme ✨
        </button>
      </div>
    </div>
  );
}

// ── Content preview per game ──────────────────────────────────────────────────

function ContentPreview({ gameId, content }: { gameId: GameId; content: unknown }) {
  if (gameId === 'truth-or-dare') {
    const c = content as TruthOrDareContent;
    return (
      <div className="space-y-4">
        <Section title="Truths" items={c.truth.slice(0, 5)} color="cyan" />
        <Section title="Dares" items={c.dare.slice(0, 5)} color="pink" />
        {(c.truth.length + c.dare.length) > 10 && (
          <p className="text-xs text-playhouse-text-tertiary text-center">
            +{c.truth.length - 5} more truths, {c.dare.length - 5} more dares
          </p>
        )}
      </div>
    );
  }

  if (gameId === 'this-or-that') {
    const c = content as ThisOrThatContent;
    return (
      <div className="space-y-2">
        {c.pairs.slice(0, 6).map((p, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1 bg-playhouse-surface rounded-lg px-3 py-2 text-sm text-playhouse-text-primary">{p.a}</div>
            <span className="text-playhouse-text-tertiary self-center text-xs">vs</span>
            <div className="flex-1 bg-playhouse-surface rounded-lg px-3 py-2 text-sm text-playhouse-text-primary">{p.b}</div>
          </div>
        ))}
        {c.pairs.length > 6 && (
          <p className="text-xs text-playhouse-text-tertiary text-center">+{c.pairs.length - 6} more pairs</p>
        )}
      </div>
    );
  }

  if (gameId === 'ranking') {
    const c = content as RankingContent;
    return (
      <div className="space-y-2">
        {c.items.slice(0, 8).map((item, i) => (
          <div key={i} className="bg-playhouse-surface rounded-lg px-3 py-2 text-sm text-playhouse-text-primary flex items-center gap-3">
            <span className="text-playhouse-text-tertiary w-4 text-right">{i + 1}.</span>
            {item}
          </div>
        ))}
        {c.items.length > 8 && (
          <p className="text-xs text-playhouse-text-tertiary text-center">+{c.items.length - 8} more items</p>
        )}
      </div>
    );
  }

  return null;
}

function Section({ title, items, color }: { title: string; items: string[]; color: 'cyan' | 'pink' }) {
  const cls = color === 'cyan'
    ? 'bg-[rgba(34,211,238,0.08)] border-[rgba(34,211,238,0.2)]'
    : 'bg-[rgba(224,71,158,0.08)] border-[rgba(224,71,158,0.2)]';
  return (
    <div className={`rounded-xl p-4 border ${cls}`}>
      <p className="text-xs uppercase tracking-wide text-playhouse-text-secondary mb-2">{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-playhouse-text-primary">• {item}</li>
        ))}
      </ul>
    </div>
  );
}
