import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import type { StoryBuilderContent, ThemeDoc } from '@games/shared';

const TOTAL_LINES = 12;

interface LineRecord {
  text: string;
  player: string;
}

export default function StoryGameBoard() {
  const { themeId } = useParams<{ themeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const locationState = (location.state as {
    firstPlayer?: string;
    players?: string[];
  }) ?? {};

  const [theme, setTheme] = useState<(ThemeDoc & { id: string }) | null>(null);
  const [starter, setStarter] = useState('');
  const [lines, setLines] = useState<LineRecord[]>([]);
  const linesRef = useRef<LineRecord[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const [players] = useState<string[]>(
    locationState.players ?? [user?.displayName ?? 'Player 1']
  );
  const [playerIndex, setPlayerIndex] = useState(() => {
    const i = locationState.firstPlayer ? players.indexOf(locationState.firstPlayer) : 0;
    return i === -1 ? 0 : i;
  });
  const currentPlayer = players[playerIndex] ?? players[0];

  const saveHistory = useCallback(async () => {
    if (!user || !themeId || !theme) return;
    await addDoc(collection(db, 'gameHistory'), {
      uid: user.uid,
      sessionId: null,
      gameId: 'story-builder',
      themeId,
      themeName: theme.name,
      result: { starter, lines: linesRef.current },
      playedAt: serverTimestamp(),
    });
  }, [user, themeId, theme, starter]);

  useEffect(() => {
    if (!themeId) return;
    getDoc(doc(db, 'themes', themeId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as ThemeDoc;
        setTheme({ id: snap.id, ...data });
        const content = data.content as StoryBuilderContent;
        setStarter(content.starter);
      }
      setLoading(false);
    });
  }, [themeId]);

  async function submitLine() {
    const text = input.trim();
    if (!text) return;

    const newLines = [...lines, { text, player: currentPlayer }];
    linesRef.current = newLines;
    setLines(newLines);
    setInput('');

    if (newLines.length >= TOTAL_LINES) {
      await saveHistory();
      setDone(true);
    } else if (players.length > 1) {
      setPlayerIndex((playerIndex + 1) % players.length);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!theme) return <div className="p-6 text-playhouse-text-secondary">No story found.</div>;

  if (done) {
    return (
      <div className="page-layer min-h-screen p-6">
        <div className="max-w-lg mx-auto space-y-6">
          <h1 className="font-display font-bold text-2xl text-playhouse-text-primary text-center">Your Story</h1>
          <div className="bg-playhouse-surface border border-white/[0.06] rounded-2xl p-6">
            <p className="text-playhouse-text-primary leading-relaxed">
              {starter}{' '}
              {lines.map((l, i) => (
                <span key={i}>{l.text} </span>
              ))}
            </p>
          </div>
          {players.length > 1 && (
            <div className="space-y-1">
              {lines.map((l, i) => (
                <p key={i} className="text-xs text-playhouse-text-tertiary">
                  <span className="text-playhouse-text-secondary">{l.player}:</span> {l.text}
                </p>
              ))}
            </div>
          )}
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#e0479e,#a855f7)' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-layer min-h-screen p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <span
            onClick={() => navigate(-1)}
            className="text-sm text-playhouse-text-secondary hover:text-playhouse-text-primary cursor-pointer transition-colors"
          >
            ← Back
          </span>
          <h1 className="font-display font-bold text-2xl text-playhouse-text-primary mt-4">📖 {theme.name}</h1>
          <p className="text-playhouse-text-tertiary text-xs mt-1">{lines.length} / {TOTAL_LINES} lines</p>
        </div>

        <div className="bg-playhouse-surface border border-white/[0.06] rounded-2xl p-5 max-h-64 overflow-y-auto">
          <p className="text-playhouse-text-primary leading-relaxed">
            {starter}{' '}
            {lines.map((l, i) => (
              <span key={i}>{l.text} </span>
            ))}
          </p>
        </div>

        <div>
          {players.length > 1 && (
            <p className="font-display font-bold text-lg mb-2 text-playhouse-text-primary">{currentPlayer}'s turn</p>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add the next line…"
            rows={2}
            className="w-full bg-playhouse-bg border border-white/10 rounded-xl p-3 text-playhouse-text-primary placeholder:text-playhouse-text-tertiary resize-none focus:outline-none focus:border-playhouse-accent-primary transition-colors"
          />
          <button
            onClick={submitLine}
            disabled={!input.trim()}
            className="w-full mt-3 py-3 rounded-xl font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#fbbf24,#f472b6)' }}
          >
            {lines.length + 1 >= TOTAL_LINES ? 'Finish Story' : 'Add Line →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="page-layer min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
