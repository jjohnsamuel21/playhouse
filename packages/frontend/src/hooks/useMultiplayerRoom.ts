import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { SOCKET_EVENTS } from '@games/shared';

export interface MultiplayerPlayerInfo {
  uid: string;
  displayName: string;
  photoURL?: string;
}

interface Options {
  sessionId?: string;
  hostId?: string;
  playerInfos?: MultiplayerPlayerInfo[];
  /**
   * Called when GAME_ENDED is received, before navigating home.
   * Use this to write game history. Errors are swallowed so navigation always happens.
   */
  onGameEnded?: () => Promise<void>;
}

interface UseMultiplayerRoomReturn {
  isMultiplayer: boolean;
  isHost: boolean;
  currentHostId: string;
  disconnectedPlayers: string[];
  skippedNotices: string[];
  /** Non-null when the game has been ended by someone — render a "game ended" screen */
  gameEndedBy: string | null;
  playerInfoMapRef: React.MutableRefObject<Record<string, string>>;
  endGame: () => void;
  dismissDisconnect: (index: number) => void;
  dismissSkip: (index: number) => void;
}

export function useMultiplayerRoom({
  sessionId,
  hostId: initialHostId,
  playerInfos = [],
  onGameEnded,
}: Options): UseMultiplayerRoomReturn {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const isMultiplayer = !!sessionId;

  // Build uid → displayName map once; stable across renders
  const playerInfoMapRef = useRef<Record<string, string>>(
    Object.fromEntries(playerInfos.map((p) => [p.uid, p.displayName]))
  );

  // Keep onGameEnded callback in ref so socket handler never goes stale
  const onGameEndedRef = useRef(onGameEnded);
  useEffect(() => { onGameEndedRef.current = onGameEnded; }, [onGameEnded]);

  const [currentHostId, setCurrentHostId] = useState(initialHostId ?? '');
  const [disconnectedPlayers, setDisconnectedPlayers] = useState<string[]>([]);
  const [skippedNotices, setSkippedNotices] = useState<string[]>([]);
  const [gameEndedBy, setGameEndedBy] = useState<string | null>(null);

  const isHost = user?.uid === currentHostId;

  useEffect(() => {
    if (!socket || !isMultiplayer) return;

    socket.on(SOCKET_EVENTS.PLAYER_LEFT, ({ uid: leftUid, newHostId }: { uid: string; newHostId: string | null }) => {
      const name = playerInfoMapRef.current[leftUid] ?? 'A player';
      setDisconnectedPlayers((prev) => [...prev, name]);
      if (newHostId) setCurrentHostId(newHostId);
    });

    socket.on(SOCKET_EVENTS.PLAYER_SKIPPED, ({ displayName: skippedName }: { uid: string; displayName: string; reason: string }) => {
      setSkippedNotices((prev) => [...prev, `${skippedName} was skipped for inactivity`]);
    });

    socket.on(SOCKET_EVENTS.GAME_ENDED, ({ displayName: endedByName }: { endedBy: string; displayName: string }) => {
      setGameEndedBy(endedByName);
      (onGameEndedRef.current?.() ?? Promise.resolve())
        .catch(console.error)
        .finally(() => setTimeout(() => navigate('/'), 3000));
    });

    return () => {
      socket.off(SOCKET_EVENTS.PLAYER_LEFT);
      socket.off(SOCKET_EVENTS.PLAYER_SKIPPED);
      socket.off(SOCKET_EVENTS.GAME_ENDED);
    };
  }, [socket, isMultiplayer]);

  function endGame() {
    socket?.emit(SOCKET_EVENTS.END_GAME);
  }

  function dismissDisconnect(index: number) {
    setDisconnectedPlayers((prev) => prev.filter((_, i) => i !== index));
  }

  function dismissSkip(index: number) {
    setSkippedNotices((prev) => prev.filter((_, i) => i !== index));
  }

  return {
    isMultiplayer,
    isHost,
    currentHostId,
    disconnectedPlayers,
    skippedNotices,
    gameEndedBy,
    playerInfoMapRef,
    endGame,
    dismissDisconnect,
    dismissSkip,
  };
}
