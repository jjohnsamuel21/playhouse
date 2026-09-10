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
    if (gameId === 'truth-or-dare') navigate(`/game/truth-or-dare/toss/${generatedThemeId}`);
    else navigate(`/game/${gameId}/play/${generatedThemeId}`);
  }

  // ── Generating screen ───────────────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-spin inline-block">✨</div>
          <p className="text-lg font-medium">Claude is generating your theme…</p>
          <p className="text-gray-400 text-sm">This takes 15–30 seconds</p>
        </div>
      </div>
    );
  }

  // ── Preview screen ──────────────────────────────────────────────────────────
  if (step === 'preview' && generatedContent) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-lg mx-auto space-y-6">
          <div>
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mb-4 flex items-center gap-2">← Back</button>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-indigo-400 text-sm">✨ AI Generated</span>
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{visibility}</span>
            </div>
            <h1 className="text-2xl font-bold">{themeName}</h1>
            <p className="text-gray-400 text-sm mt-1">Based on: {interests.join(', ')}</p>
          </div>

          <ContentPreview gameId={gameId} content={generatedContent} />

          <div className="flex gap-3">
            <button
              onClick={playNow}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-colors"
            >
              Play Now
            </button>
            <button
              onClick={() => navigate(`/game/${gameId}/themes`)}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
            >
              Back to Themes
            </button>
          </div>

          <button
            onClick={() => { setStep('form'); setGeneratedThemeId(null); setGeneratedContent(null); }}
            className="w-full text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            Generate Another
          </button>
        </div>
      </div>
    );
  }

  // ── Form screen ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-lg mx-auto space-y-8">
        <div>
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mb-4 flex items-center gap-2">← Back</button>
          <h1 className="text-2xl font-bold">✨ Generate with AI</h1>
          <p className="text-gray-400 text-sm mt-1">Claude creates a custom theme based on your interests</p>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Game selector */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400 uppercase tracking-wide">Game</label>
          <div className="grid grid-cols-3 gap-2">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => setGameId(g.id)}
                className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                  gameId === g.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                }`}
              >
                <span className="block text-xl mb-1">{g.emoji}</span>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme name */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400 uppercase tracking-wide">Theme Name</label>
          <input
            type="text"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            placeholder="e.g. Office Party, Movie Night, Road Trip…"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Interests tags */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400 uppercase tracking-wide">Interests / Topics</label>
          <div className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 focus-within:border-indigo-500 transition-colors min-h-[52px] flex flex-wrap gap-2 items-center">
            {interests.map((tag) => (
              <span key={tag} className="flex items-center gap-1 bg-indigo-700/50 text-indigo-200 text-sm px-2 py-1 rounded-lg">
                {tag}
                <button onClick={() => removeTag(tag)} className="text-indigo-400 hover:text-white">×</button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={addTag}
              placeholder={interests.length === 0 ? 'Type an interest, press Enter…' : ''}
              className="flex-1 min-w-[120px] bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm py-1"
            />
          </div>
          <p className="text-xs text-gray-600">Press Enter or comma to add each interest</p>
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400 uppercase tracking-wide">Visibility</label>
          <div className="grid grid-cols-2 gap-2">
            {(['private', 'public'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                  visibility === v
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                }`}
              >
                {v === 'private' ? '🔒 Private' : '🌐 Public'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600">
            {visibility === 'private' ? 'Only you can see and use this theme' : 'Visible to all players'}
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!themeName.trim() || interests.length === 0}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold text-lg transition-colors"
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
        <Section title="Truths" items={c.truth.slice(0, 5)} color="blue" />
        <Section title="Dares" items={c.dare.slice(0, 5)} color="red" />
        {(c.truth.length + c.dare.length) > 10 && (
          <p className="text-xs text-gray-500 text-center">+{c.truth.length - 5} more truths, {c.dare.length - 5} more dares</p>
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
            <div className="flex-1 bg-gray-900 rounded-lg px-3 py-2 text-sm">{p.a}</div>
            <span className="text-gray-500 self-center text-xs">vs</span>
            <div className="flex-1 bg-gray-900 rounded-lg px-3 py-2 text-sm">{p.b}</div>
          </div>
        ))}
        {c.pairs.length > 6 && <p className="text-xs text-gray-500 text-center">+{c.pairs.length - 6} more pairs</p>}
      </div>
    );
  }

  if (gameId === 'ranking') {
    const c = content as RankingContent;
    return (
      <div className="space-y-2">
        {c.items.slice(0, 8).map((item, i) => (
          <div key={i} className="bg-gray-900 rounded-lg px-3 py-2 text-sm flex items-center gap-3">
            <span className="text-gray-500 w-4 text-right">{i + 1}.</span>
            {item}
          </div>
        ))}
        {c.items.length > 8 && <p className="text-xs text-gray-500 text-center">+{c.items.length - 8} more items</p>}
      </div>
    );
  }

  return null;
}

function Section({ title, items, color }: { title: string; items: string[]; color: 'blue' | 'red' }) {
  const cls = color === 'blue'
    ? 'bg-blue-900/30 border-blue-500/20'
    : 'bg-red-900/30 border-red-500/20';
  return (
    <div className={`rounded-xl p-4 border ${cls}`}>
      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => <li key={i} className="text-sm text-gray-300">• {item}</li>)}
      </ul>
    </div>
  );
}
