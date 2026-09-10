import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../contexts/SocketContext';
import type { ThisOrThatContent, ThemeDoc } from '@games/shared';
import { SOCKET_EVENTS } from '@games/shared';
import ChatPanel from '../../../components/ChatPanel';
import { MultiplayerBanners, GameEndedScreen } from '../../../components/MultiplayerBanners';
import { useMultiplayerRoom } from '../../../hooks/useMultiplayerRoom';

interface ChoiceRecord { pair: { a: string; b: string }; selected: string; player: string; }
interface PlayerInfo { uid: string; displayName: string; photoURL: string; }

export default function TotGameBoard() {
  const { themeId } = useParams<{ themeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const locationState = (location.state as {
    firstPlayer?: string;
    players?: string[];
    sessionId?: string;
    roomCode?: string;
    playerInfos?: PlayerInfo[];
    hostId?: string;
  }) ?? {};

  const [theme, setTheme] = useState<(ThemeDoc & { id: string }) | null>(null);
  const [pairs, setPairs] = useState<{ a: string; b: string }[]>([]);
  const [round, setRound] = useState(0);
  const [choices, setChoices] = useState<ChoiceRecord[]>([]);
  const choicesRef = useRef<ChoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  // Solo/local pass-and-play turn state — round-robins one player per pair
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
      sessionId: locationState.sessionId ?? null,
      gameId: 'this-or-that',
      themeId,
      themeName: theme.name,
      result: { choices: choicesRef.current },
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
        const content = data.content as ThisOrThatContent;
        const shuffled = [...content.pairs].sort(() => Math.random() - 0.5).slice(0, 20);
        setPairs(shuffled);
      }
      setLoading(false);
    });
  }, [themeId]);

  function handleSelect(option: string) {
    const pair = pairs[round];
    const choice: ChoiceRecord = { pair, selected: option, player: currentPlayer };
    const newChoices = [...choices, choice];
    choicesRef.current = newChoices;
    setChoices(newChoices);

    if (!isMultiplayer && players.length > 1) {
      setPlayerIndex((playerIndex + 1) % players.length);
    }

    if (round + 1 >= pairs.length) {
      saveHistory();
      setDone(true);
    } else {
      setRound(round + 1);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!theme || pairs.length === 0) return <div className="p-6 text-playhouse-text-secondary">No pairs found.</div>;
  if (gameEndedBy) return <GameEndedScreen endedBy={gameEndedBy} />;

  if (done) {
    return (
      <div className="page-layer min-h-screen p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="font-display font-bold text-2xl mb-6 text-center text-playhouse-text-primary">Your Choices</h1>
          <div className="space-y-3 mb-8">
            {choices.map((c, i) => (
              <div key={i} className="bg-playhouse-surface border border-white/[0.06] rounded-xl p-4">
                {players.length > 1 && (
                  <p className="text-xs text-playhouse-text-tertiary mb-2">{c.player}</p>
                )}
                <div className="flex gap-3">
                  <div className={`flex-1 p-3 rounded-lg text-sm ${c.selected === c.pair.a ? 'text-white' : 'bg-white/[0.04] text-playhouse-text-tertiary'}`} style={c.selected === c.pair.a ? { background: 'linear-gradient(135deg,#e0479e,#a855f7)' } : undefined}>{c.pair.a}</div>
                  <div className={`flex-1 p-3 rounded-lg text-sm ${c.selected === c.pair.b ? 'text-white' : 'bg-white/[0.04] text-playhouse-text-tertiary'}`} style={c.selected === c.pair.b ? { background: 'linear-gradient(135deg,#e0479e,#a855f7)' } : undefined}>{c.pair.b}</div>
                </div>
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

  const { a: optA, b: optB } = pairs[round];

  return (
    <div className="page-layer min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">

        <MultiplayerBanners
          disconnectedPlayers={disconnectedPlayers}
          skippedNotices={skippedNotices}
          onDismissDisconnect={dismissDisconnect}
          onDismissSkip={dismissSkip}
        />

        <div className="text-center">
          {!isMultiplayer && players.length > 1 && (
            <p className="font-display font-bold text-lg mb-1 text-playhouse-text-primary">{currentPlayer}'s turn</p>
          )}
          <p className="text-playhouse-text-secondary text-sm">{theme.name}</p>
          <p className="text-playhouse-text-tertiary text-xs mt-1">{round + 1} / {pairs.length}</p>
        </div>

        <div className="w-full bg-white/[0.06] rounded-full h-1">
          <div
            className="h-1 rounded-full transition-all"
            style={{ width: `${((round + 1) / pairs.length) * 100}%`, background: 'linear-gradient(90deg,#e0479e,#a855f7)' }}
          />
        </div>

        <p className="text-center text-playhouse-text-primary font-display font-medium text-lg">This or That?</p>

        <div className="space-y-4">
          <button
            onClick={() => handleSelect(optA)}
            className="w-full py-6 px-4 bg-playhouse-surface hover:bg-[rgba(224,71,158,0.08)] border-2 border-transparent hover:border-[rgba(224,71,158,0.35)] rounded-2xl text-left font-medium text-playhouse-text-primary transition-all"
          >
            {optA}
          </button>
          <button
            onClick={() => handleSelect(optB)}
            className="w-full py-6 px-4 bg-playhouse-surface hover:bg-[rgba(224,71,158,0.08)] border-2 border-transparent hover:border-[rgba(224,71,158,0.35)] rounded-2xl text-left font-medium text-playhouse-text-primary transition-all"
          >
            {optB}
          </button>
        </div>

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
