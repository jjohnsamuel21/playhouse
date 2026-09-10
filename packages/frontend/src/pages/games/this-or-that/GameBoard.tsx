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

interface ChoiceRecord { pair: { a: string; b: string }; selected: string; }
interface PlayerInfo { uid: string; displayName: string; photoURL: string; }

export default function TotGameBoard() {
  const { themeId } = useParams<{ themeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const locationState = (location.state as {
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
    const choice: ChoiceRecord = { pair, selected: option };
    const newChoices = [...choices, choice];
    choicesRef.current = newChoices;
    setChoices(newChoices);

    if (round + 1 >= pairs.length) {
      saveHistory();
      setDone(true);
    } else {
      setRound(round + 1);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!theme || pairs.length === 0) return <div className="p-6 text-gray-400">No pairs found.</div>;
  if (gameEndedBy) return <GameEndedScreen endedBy={gameEndedBy} />;

  if (done) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Your Choices</h1>
          <div className="space-y-3 mb-8">
            {choices.map((c, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-4">
                <div className="flex gap-3">
                  <div className={`flex-1 p-3 rounded-lg text-sm ${c.selected === c.pair.a ? 'bg-indigo-600' : 'bg-gray-800 text-gray-500'}`}>{c.pair.a}</div>
                  <div className={`flex-1 p-3 rounded-lg text-sm ${c.selected === c.pair.b ? 'bg-indigo-600' : 'bg-gray-800 text-gray-500'}`}>{c.pair.b}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/')} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-colors">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { a: optA, b: optB } = pairs[round];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">

        <MultiplayerBanners
          disconnectedPlayers={disconnectedPlayers}
          skippedNotices={skippedNotices}
          onDismissDisconnect={dismissDisconnect}
          onDismissSkip={dismissSkip}
        />

        <div className="text-center">
          <p className="text-gray-400 text-sm">{theme.name}</p>
          <p className="text-gray-500 text-xs mt-1">{round + 1} / {pairs.length}</p>
        </div>

        <div className="w-full bg-gray-800 rounded-full h-1">
          <div className="bg-indigo-500 h-1 rounded-full transition-all" style={{ width: `${((round + 1) / pairs.length) * 100}%` }} />
        </div>

        <p className="text-center text-gray-300 font-medium text-lg">This or That?</p>

        <div className="space-y-4">
          <button onClick={() => handleSelect(optA)} className="w-full py-6 px-4 bg-gray-900 hover:bg-indigo-900/50 border-2 border-transparent hover:border-indigo-500 rounded-2xl text-left font-medium transition-all">
            {optA}
          </button>
          <button onClick={() => handleSelect(optB)} className="w-full py-6 px-4 bg-gray-900 hover:bg-indigo-900/50 border-2 border-transparent hover:border-indigo-500 rounded-2xl text-left font-medium transition-all">
            {optB}
          </button>
        </div>

        {isMultiplayer && isHost && (
          <button onClick={endGame} className="w-full text-gray-500 hover:text-gray-300 text-sm transition-colors">
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
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
