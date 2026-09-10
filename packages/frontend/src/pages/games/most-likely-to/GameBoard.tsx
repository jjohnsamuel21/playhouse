import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import type { MostLikelyToContent, ThemeDoc } from '@games/shared';

interface VoteRecord {
  prompt: string;
  votedFor: string;
}

export default function MltGameBoard() {
  const { themeId } = useParams<{ themeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const locationState = (location.state as { players?: string[] }) ?? {};
  const [players] = useState<string[]>(locationState.players ?? [user?.displayName ?? 'Player 1']);

  const [theme, setTheme] = useState<(ThemeDoc & { id: string }) | null>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const [tally, setTally] = useState<Record<string, number>>({});
  const votesRef = useRef<VoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const saveHistory = useCallback(async () => {
    if (!user || !themeId || !theme) return;
    await addDoc(collection(db, 'gameHistory'), {
      uid: user.uid,
      sessionId: null,
      gameId: 'most-likely-to',
      themeId,
      themeName: theme.name,
      result: { tally, votes: votesRef.current },
      playedAt: serverTimestamp(),
    });
  }, [user, themeId, theme, tally]);

  useEffect(() => {
    if (!themeId) return;
    getDoc(doc(db, 'themes', themeId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as ThemeDoc;
        setTheme({ id: snap.id, ...data });
        const content = data.content as MostLikelyToContent;
        const shuffled = [...content.prompts].sort(() => Math.random() - 0.5);
        setPrompts(shuffled);
      }
      setLoading(false);
    });
  }, [themeId]);

  async function handleVote(name: string) {
    votesRef.current = [...votesRef.current, { prompt: prompts[round], votedFor: name }];
    const nextTally = { ...tally, [name]: (tally[name] ?? 0) + 1 };
    setTally(nextTally);

    if (round + 1 >= prompts.length) {
      await saveHistory();
      setDone(true);
    } else {
      setRound(round + 1);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!theme || prompts.length === 0) {
    return <div className="p-6 text-playhouse-text-secondary">No prompts found.</div>;
  }

  if (done) {
    const leaderboard = [...players].sort((a, b) => (tally[b] ?? 0) - (tally[a] ?? 0));
    return (
      <div className="page-layer min-h-screen p-6">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <h1 className="font-display font-bold text-2xl text-playhouse-text-primary">Results</h1>
          <div className="space-y-2">
            {leaderboard.map((name, i) => (
              <div key={name} className="bg-playhouse-surface border border-white/[0.06] rounded-xl p-4 flex items-center gap-4">
                <span className="text-2xl w-8">{i === 0 ? '👑' : `#${i + 1}`}</span>
                <span className="flex-1 text-left text-playhouse-text-primary">{name}</span>
                <span className="text-playhouse-text-secondary text-sm">{tally[name] ?? 0} votes</span>
              </div>
            ))}
          </div>
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
    <div className="page-layer min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-playhouse-text-secondary text-sm">{theme.name}</p>
          <p className="text-playhouse-text-tertiary text-xs mt-1">{round + 1} / {prompts.length}</p>
        </div>

        <div className="w-full bg-white/[0.06] rounded-full h-1">
          <div
            className="h-1 rounded-full transition-all"
            style={{ width: `${((round + 1) / prompts.length) * 100}%`, background: 'linear-gradient(90deg,#6366f1,#22d3ee)' }}
          />
        </div>

        <p className="text-center text-playhouse-text-primary font-display font-medium text-xl">
          Most likely to {prompts[round]}
        </p>
        <p className="text-center text-playhouse-text-tertiary text-xs">Tap who fits best</p>

        <div className="space-y-3">
          {players.map((name) => (
            <button
              key={name}
              onClick={() => handleVote(name)}
              className="w-full py-4 px-4 bg-playhouse-surface hover:bg-[rgba(99,102,241,0.1)] border-2 border-transparent hover:border-[rgba(99,102,241,0.35)] rounded-2xl text-left font-medium text-playhouse-text-primary transition-all"
            >
              {name}
            </button>
          ))}
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
