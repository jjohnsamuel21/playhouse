import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../contexts/SocketContext';
import type { TruthOrDareContent, ThemeDoc } from '@games/shared';
import { SOCKET_EVENTS, type GameActionPayload } from '@games/shared';
import ChatPanel from '../../../components/ChatPanel';
import { MultiplayerBanners, GameEndedScreen } from '../../../components/MultiplayerBanners';
import { useMultiplayerRoom } from '../../../hooks/useMultiplayerRoom';

interface PlayerInfo { uid: string; displayName: string; photoURL: string; }
type Choice = 'truth' | 'dare';

export default function TodGameBoard() {
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
    playerIds?: string[];
    playerInfos?: PlayerInfo[];
    hostId?: string;
  }) ?? {};

  const [theme, setTheme] = useState<(ThemeDoc & { id: string }) | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentType, setCurrentType] = useState<Choice | null>(null);
  // Solo state
  const [currentPlayer, setCurrentPlayer] = useState(locationState.firstPlayer ?? user?.displayName ?? 'Player 1');
  const [players] = useState<string[]>(locationState.players ?? [user?.displayName ?? 'Player 1', 'Player 2']);
  const [playerIndex, setPlayerIndex] = useState(0);
  // Multiplayer state
  const [mpPlayerIds, setMpPlayerIds] = useState<string[]>(locationState.playerIds ?? []);
  const [mpCurrentIndex, setMpCurrentIndex] = useState(0);
  const historyRef = useRef<{ player: string; type: Choice; question: string }[]>([]);
  const [history, setHistory] = useState<{ player: string; type: Choice; question: string }[]>([]);
  const [usedTruth, setUsedTruth] = useState<Set<number>>(new Set());
  const [usedDare, setUsedDare] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const saveHistory = useCallback(async () => {
    if (!user || !themeId || !theme) return;
    await addDoc(collection(db, 'gameHistory'), {
      uid: user.uid,
      sessionId: locationState.sessionId ?? null,
      gameId: 'truth-or-dare',
      themeId,
      themeName: theme.name,
      result: { rounds: historyRef.current.length, history: historyRef.current },
      playedAt: serverTimestamp(),
    });
  }, [user, themeId, theme, locationState.sessionId]);

  const {
    isMultiplayer,
    isHost,
    disconnectedPlayers,
    skippedNotices,
    gameEndedBy,
    playerInfoMapRef,
    endGame,
    dismissDisconnect,
    dismissSkip,
  } = useMultiplayerRoom({
    sessionId: locationState.sessionId,
    hostId: locationState.hostId,
    playerInfos: locationState.playerInfos,
    onGameEnded: saveHistory,
  });

  const mpCurrentUid = mpPlayerIds[mpCurrentIndex] ?? '';
  const isMpCurrentPlayer = isMultiplayer && mpCurrentUid === user?.uid;
  const mpCurrentName = playerInfoMapRef.current[mpCurrentUid] ?? 'Player';
  const isLastPlayer = isMultiplayer && mpPlayerIds.length === 1 && mpPlayerIds[0] === user?.uid;

  useEffect(() => {
    if (!themeId) return;
    getDoc(doc(db, 'themes', themeId)).then((snap) => {
      if (snap.exists()) setTheme({ id: snap.id, ...(snap.data() as ThemeDoc) });
      setLoading(false);
    });
  }, [themeId]);

  // Multiplayer turn sync
  useEffect(() => {
    if (!socket || !isMultiplayer) return;

    socket.on(SOCKET_EVENTS.STATE_UPDATE, ({ state }: { state: {
      currentPlayerIndex: number;
      playerIds: string[];
      currentQuestion: string | null;
      currentType: string | null;
    }}) => {
      setMpCurrentIndex(state.currentPlayerIndex);
      setMpPlayerIds(state.playerIds);
      setCurrentQuestion(state.currentQuestion);
      setCurrentType(state.currentType as Choice | null);
      if (state.currentQuestion && state.currentType) {
        const name = playerInfoMapRef.current[state.playerIds[state.currentPlayerIndex]] ?? 'Player';
        const entry = { player: name, type: state.currentType as Choice, question: state.currentQuestion };
        historyRef.current = [...historyRef.current, entry];
        setHistory([...historyRef.current]);
      }
    });

    return () => { socket.off(SOCKET_EVENTS.STATE_UPDATE); };
  }, [socket, isMultiplayer]);

  function pickQuestion(type: Choice): string | null {
    const content = theme?.content as TruthOrDareContent;
    if (!content) return null;
    const pool = content[type];
    const used = type === 'truth' ? usedTruth : usedDare;
    const available = pool.map((_, i) => i).filter((i) => !used.has(i));
    if (available.length === 0) return null;
    const idx = available[Math.floor(Math.random() * available.length)];
    (type === 'truth' ? setUsedTruth : setUsedDare)((prev) => new Set([...prev, idx]));
    return pool[idx];
  }

  function handleChoose(type: Choice) {
    const q = pickQuestion(type);
    if (!q) return;
    if (isMultiplayer) {
      socket?.emit(SOCKET_EVENTS.GAME_ACTION, { type: 'SHOW_QUESTION', questionType: type, question: q } as GameActionPayload);
      return;
    }
    setCurrentQuestion(q);
    setCurrentType(type);
    const entry = { player: currentPlayer, type, question: q };
    historyRef.current = [...historyRef.current, entry];
    setHistory([...historyRef.current]);
  }

  function nextTurn() {
    if (isMultiplayer) {
      socket?.emit(SOCKET_EVENTS.GAME_ACTION, { type: 'NEXT_TURN' } as GameActionPayload);
    } else {
      const next = (playerIndex + 1) % players.length;
      setPlayerIndex(next);
      setCurrentPlayer(players[next]);
    }
    setCurrentQuestion(null);
    setCurrentType(null);
  }

  async function handleEndGame() {
    if (isMultiplayer) {
      endGame(); // server broadcasts GAME_ENDED → onGameEnded → navigate
      return;
    }
    await saveHistory();
    navigate('/');
  }

  if (loading) return <LoadingScreen />;
  if (gameEndedBy) return <GameEndedScreen endedBy={gameEndedBy} />;

  return (
    <div className="page-layer min-h-screen flex flex-col items-center p-6">
      <div className="w-full max-w-md mt-8 space-y-6">

        <MultiplayerBanners
          disconnectedPlayers={disconnectedPlayers}
          skippedNotices={skippedNotices}
          onDismissDisconnect={dismissDisconnect}
          onDismissSkip={dismissSkip}
        />

        {/* Last player standing */}
        {isLastPlayer && (
          <div className="bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.3)] rounded-xl px-4 py-3 text-center">
            <p className="text-amber-300 text-sm font-medium">You're the only player left</p>
            <button
              onClick={handleEndGame}
              className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-semibold text-white transition-colors"
            >
              End Game
            </button>
          </div>
        )}

        {/* Current player */}
        <div className="text-center">
          <p className="text-playhouse-text-secondary text-sm">Current player</p>
          <h2 className="font-display font-bold text-2xl text-playhouse-text-primary mt-1">
            {isMultiplayer ? mpCurrentName : currentPlayer}
          </h2>
          {isMultiplayer && !isMpCurrentPlayer && !currentQuestion && !isLastPlayer && (
            <p className="text-playhouse-text-tertiary text-sm mt-1">Waiting for {mpCurrentName} to choose…</p>
          )}
        </div>

        {/* Question card */}
        {currentQuestion ? (
          <div className={`rounded-2xl p-6 text-center border ${currentType === 'truth' ? 'bg-[rgba(34,211,238,0.08)] border-[rgba(34,211,238,0.25)]' : 'bg-[rgba(224,71,158,0.08)] border-[rgba(224,71,158,0.25)]'}`}>
            <span className="text-xs font-semibold uppercase tracking-widest text-playhouse-text-secondary">{currentType}</span>
            <p className="text-xl font-medium mt-3 leading-relaxed text-playhouse-text-primary">{currentQuestion}</p>
            {isMultiplayer && currentType === 'truth' && (
              <p className="text-xs text-playhouse-text-tertiary mt-3">Answer in chat below 💬</p>
            )}
          </div>
        ) : (
          !isLastPlayer && (
            <div className="bg-playhouse-surface border border-white/[0.06] rounded-2xl p-6 text-center text-playhouse-text-tertiary">
              Pick truth or dare
            </div>
          )
        )}

        {/* Action buttons */}
        {!isLastPlayer && (
          !currentQuestion ? (
            (!isMultiplayer || isMpCurrentPlayer) && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleChoose('truth')}
                  className="py-4 rounded-xl font-bold text-lg text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#22d3ee,#6366f1)' }}
                >
                  Truth
                </button>
                <button
                  onClick={() => handleChoose('dare')}
                  className="py-4 rounded-xl font-bold text-lg text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#e0479e,#a855f7)' }}
                >
                  Dare
                </button>
              </div>
            )
          ) : (
            (!isMultiplayer || isMpCurrentPlayer) && (
              <button
                onClick={nextTurn}
                className="w-full py-3 rounded-xl font-semibold border border-white/10 text-playhouse-text-primary hover:bg-white/[0.04] transition-colors"
              >
                Next Player →
              </button>
            )
          )
        )}

        {/* End game — host only in multiplayer, always available in solo */}
        {!isLastPlayer && (!isMultiplayer || isHost) && (
          <button onClick={handleEndGame} className="w-full text-playhouse-text-tertiary hover:text-playhouse-text-secondary text-sm transition-colors">
            End Game
          </button>
        )}

        {/* Round history */}
        {history.length > 0 && (
          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-xs text-playhouse-text-tertiary mb-2 uppercase tracking-wide">History</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[...history].reverse().map((item, i) => (
                <div key={i} className="text-sm text-playhouse-text-secondary">
                  <span className="font-medium text-playhouse-text-primary">{item.player}</span>
                  {' · '}
                  <span className={item.type === 'truth' ? 'text-cyan-400' : 'text-playhouse-accent-primary'}>{item.type}</span>
                  {' · '}
                  {item.question}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isMultiplayer && locationState.sessionId && (
        <ChatPanel sessionId={locationState.sessionId} />
      )}
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
