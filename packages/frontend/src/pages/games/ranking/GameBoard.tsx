import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import type { RankingContent, ThemeDoc } from '@games/shared';
import ChatPanel from '../../../components/ChatPanel';
import { MultiplayerBanners, GameEndedScreen } from '../../../components/MultiplayerBanners';
import { useMultiplayerRoom } from '../../../hooks/useMultiplayerRoom';

interface PlayerInfo { uid: string; displayName: string; photoURL: string; }

export default function RankGameBoard() {
  const { themeId } = useParams<{ themeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const locationState = (location.state as {
    firstPlayer?: string;
    players?: string[];
    sessionId?: string;
    roomCode?: string;
    playerInfos?: PlayerInfo[];
    hostId?: string;
  }) ?? {};

  const [theme, setTheme] = useState<(ThemeDoc & { id: string }) | null>(null);
  const [ranked, setRanked] = useState<string[]>([]);
  const [unranked, setUnranked] = useState<string[]>([]);
  const rankedRef = useRef<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  // Solo/local pass-and-play turn state — round-robins whose turn it is to draft the next pick
  const [players] = useState<string[]>(
    locationState.players ?? [user?.displayName ?? 'Player 1']
  );
  const [playerIndex, setPlayerIndex] = useState(() => {
    const i = locationState.firstPlayer ? players.indexOf(locationState.firstPlayer) : 0;
    return i === -1 ? 0 : i;
  });
  const currentPlayer = players[playerIndex] ?? players[0];
  const [pickedBy, setPickedBy] = useState<Record<string, string>>({});

  const saveHistory = useCallback(async () => {
    if (!user || !themeId || !theme) return;
    await addDoc(collection(db, 'gameHistory'), {
      uid: user.uid,
      sessionId: locationState.sessionId ?? null,
      gameId: 'ranking',
      themeId,
      themeName: theme.name,
      result: { rankedItems: rankedRef.current },
      playedAt: serverTimestamp(),
    });
  }, [user, themeId, theme, locationState.sessionId]);

  const {
    isMultiplayer,
    isHost,
    disconnectedPlayers,
    skippedNotices,
    gameEndedBy,
    endGame,
    dismissDisconnect,
    dismissSkip,
  } = useMultiplayerRoom({
    sessionId: locationState.sessionId,
    hostId: locationState.hostId,
    playerInfos: locationState.playerInfos,
    onGameEnded: saveHistory,
  });

  useEffect(() => {
    if (!themeId) return;
    getDoc(doc(db, 'themes', themeId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as ThemeDoc;
        setTheme({ id: snap.id, ...data });
        const content = data.content as RankingContent;
        const pool = [...content.items].sort(() => Math.random() - 0.5).slice(0, 10);
        setUnranked(pool);
      }
      setLoading(false);
    });
  }, [themeId]);

  function moveToRanked(item: string) {
    setUnranked((prev) => prev.filter((i) => i !== item));
    setRanked((prev) => { const next = [...prev, item]; rankedRef.current = next; return next; });
    setPickedBy((prev) => ({ ...prev, [item]: currentPlayer }));
    if (!isMultiplayer && players.length > 1) {
      setPlayerIndex((playerIndex + 1) % players.length);
    }
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setRanked((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      rankedRef.current = next;
      return next;
    });
  }

  function moveDown(index: number) {
    setRanked((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      rankedRef.current = next;
      return next;
    });
  }

  function removeFromRanked(item: string) {
    setRanked((prev) => { const next = prev.filter((i) => i !== item); rankedRef.current = next; return next; });
    setUnranked((prev) => [...prev, item]);
  }

  async function submit() {
    await saveHistory();
    setDone(true);
  }

  if (loading) return <LoadingScreen />;
  if (gameEndedBy) return <GameEndedScreen endedBy={gameEndedBy} />;

  if (done) {
    return (
      <div className="page-layer min-h-screen p-6">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <h1 className="font-display font-bold text-2xl text-playhouse-text-primary">Your Rankings</h1>
          <div className="space-y-2">
            {ranked.map((item, i) => (
              <div key={item} className="bg-playhouse-surface border border-white/[0.06] rounded-xl p-4 flex items-center gap-4">
                <span className="font-display text-2xl font-bold text-playhouse-accent-primary w-8">#{i + 1}</span>
                <span className="flex-1 text-left text-playhouse-text-primary">{item}</span>
                {players.length > 1 && pickedBy[item] && (
                  <span className="text-xs text-playhouse-text-tertiary">{pickedBy[item]}</span>
                )}
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
    <div className="page-layer min-h-screen p-6">
      <div className="max-w-lg mx-auto space-y-6">

        <MultiplayerBanners
          disconnectedPlayers={disconnectedPlayers}
          skippedNotices={skippedNotices}
          onDismissDisconnect={dismissDisconnect}
          onDismissSkip={dismissSkip}
        />

        <div>
          <span
            onClick={() => navigate(-1)}
            className="text-sm text-playhouse-text-secondary hover:text-playhouse-text-primary cursor-pointer transition-colors"
          >
            ← Back
          </span>
          <h1 className="font-display font-bold text-2xl text-playhouse-text-primary mt-4">🏆 {theme?.name}</h1>
          <p className="text-playhouse-text-secondary text-sm mt-1">Drag items into your ranking order</p>
        </div>

        {ranked.length > 0 && (
          <div>
            <h2 className="text-sm text-playhouse-text-secondary uppercase tracking-wide mb-2">Your Ranking</h2>
            <div className="space-y-2">
              {ranked.map((item, i) => (
                <div key={item} className="bg-[rgba(224,71,158,0.08)] border border-[rgba(224,71,158,0.25)] rounded-xl p-3 flex items-center gap-3">
                  <span className="text-playhouse-accent-primary font-bold w-6 text-center">#{i + 1}</span>
                  <span className="flex-1 text-sm text-playhouse-text-primary">{item}</span>
                  <div className="flex gap-1">
                    <button onClick={() => moveUp(i)} className="px-2 py-1 text-playhouse-text-tertiary hover:text-playhouse-text-primary text-xs">↑</button>
                    <button onClick={() => moveDown(i)} className="px-2 py-1 text-playhouse-text-tertiary hover:text-playhouse-text-primary text-xs">↓</button>
                    <button onClick={() => removeFromRanked(item)} className="px-2 py-1 text-red-400 hover:text-red-300 text-xs">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {unranked.length > 0 && (
          <div>
            {!isMultiplayer && players.length > 1 && (
              <p className="font-display text-base font-bold mb-2 text-playhouse-text-primary">{currentPlayer}'s pick</p>
            )}
            <h2 className="text-sm text-playhouse-text-secondary uppercase tracking-wide mb-2">Not yet ranked</h2>
            <div className="space-y-2">
              {unranked.map((item) => (
                <button
                  key={item}
                  onClick={() => moveToRanked(item)}
                  className="w-full bg-playhouse-surface border border-white/[0.06] hover:border-[rgba(224,71,158,0.35)] rounded-xl p-3 text-left text-sm text-playhouse-text-primary transition-colors flex items-center justify-between"
                >
                  <span>{item}</span>
                  <span className="text-playhouse-text-tertiary text-xs">tap to rank →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {unranked.length === 0 && (
          <button
            onClick={submit}
            className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}
          >
            Submit Rankings
          </button>
        )}

        {isMultiplayer && isHost && (
          <button onClick={endGame} className="w-full text-playhouse-text-tertiary hover:text-playhouse-text-secondary text-sm transition-colors">
            End Game for Everyone
          </button>
        )}
      </div>

      {locationState.sessionId && <ChatPanel sessionId={locationState.sessionId} />}
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
