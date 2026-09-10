import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { getPlugin } from '../registry/gameRegistry';
import { SOCKET_EVENTS, type PlayerJoinedPayload, type GameStartedPayload } from '@games/shared';

interface PlayerInfo {
  uid: string;
  displayName: string;
  photoURL: string;
}

export default function Room() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [readyUids, setReadyUids] = useState<Set<string>>(new Set());
  const [gameId, setGameId] = useState('');
  const [hostId, setHostId] = useState('');
  const [themeId, setThemeId] = useState('');
  const [leftNotice, setLeftNotice] = useState<string | null>(null);

  // Refs so socket event handlers always see latest values (no stale closure)
  const gameIdRef = useRef('');
  const themeIdRef = useRef('');
  const playersRef = useRef<PlayerInfo[]>([]);
  const hostIdRef = useRef('');

  const minPlayers = gameId ? getPlugin(gameId).meta.minPlayers : 2;
  const isHost = user?.uid === hostId;
  const nonHostPlayers = players.filter((p) => p.uid !== hostId);
  const allReady = nonHostPlayers.length > 0 && nonHostPlayers.every((p) => readyUids.has(p.uid));
  const canStart = players.length >= minPlayers && allReady;

  useEffect(() => {
    if (!socket || !code) return;

    socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode: code });

    socket.on('ROOM_META', ({ gameId: gid, hostId: hid, themeId: tid, players: plist }: {
      gameId: string; hostId: string; themeId: string; players: PlayerInfo[];
    }) => {
      setGameId(gid);
      setHostId(hid);
      setThemeId(tid);
      setPlayers(plist);
      gameIdRef.current = gid;
      themeIdRef.current = tid;
      hostIdRef.current = hid;
      playersRef.current = plist;
    });

    socket.on(SOCKET_EVENTS.PLAYER_READY, ({ uid: readyUid }: { uid: string }) => {
      setReadyUids((prev) => new Set([...prev, readyUid]));
    });

    socket.on(SOCKET_EVENTS.PLAYER_JOINED, (payload: PlayerJoinedPayload) => {
      setPlayers((prev) => {
        if (prev.find((p) => p.uid === payload.uid)) return prev;
        const next = [...prev, { uid: payload.uid, displayName: payload.displayName, photoURL: payload.photoURL }];
        playersRef.current = next;
        return next;
      });
    });

    socket.on(SOCKET_EVENTS.PLAYER_LEFT, ({ uid: leftUid, newHostId }: { uid: string; playerCount: number; newHostId: string | null }) => {
      setPlayers((prev) => {
        const next = prev.filter((p) => p.uid !== leftUid);
        playersRef.current = next;
        const gone = prev.find((p) => p.uid === leftUid);
        if (gone) setLeftNotice(`${gone.displayName} left the room`);
        return next;
      });
      if (newHostId) {
        setHostId(newHostId);
        hostIdRef.current = newHostId;
      }
    });

    socket.on(SOCKET_EVENTS.GAME_STARTED, (payload: GameStartedPayload & { hostId?: string }) => {
      const gid = gameIdRef.current;
      const tid = payload.themeId || themeIdRef.current;
      navigate(`/game/${gid}/play/${tid}`, {
        state: {
          sessionId: payload.sessionId,
          roomCode: code,
          playerIds: payload.playerIds,
          playerInfos: playersRef.current,
          hostId: payload.hostId ?? hostIdRef.current,
        },
      });
    });

    socket.on(SOCKET_EVENTS.ERROR, ({ message }: { message: string }) => {
      alert(`Room error: ${message}`);
      navigate('/');
    });

    return () => {
      socket.off('ROOM_META');
      socket.off(SOCKET_EVENTS.PLAYER_READY);
      socket.off(SOCKET_EVENTS.PLAYER_JOINED);
      socket.off(SOCKET_EVENTS.PLAYER_LEFT);
      socket.off(SOCKET_EVENTS.GAME_STARTED);
      socket.off(SOCKET_EVENTS.ERROR);
    };
  }, [socket, code]);

  function handleReady() {
    socket?.emit(SOCKET_EVENTS.PLAYER_READY, { roomCode: code });
    setIsReady(true);
  }

  function handleStart() {
    socket?.emit(SOCKET_EVENTS.START_GAME, { roomCode: code });
  }

  return (
    <div className="page-layer min-h-screen flex items-center justify-center p-6">
      {leftNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-playhouse-surface border border-white/10 text-playhouse-text-primary px-4 py-2 rounded-xl text-sm shadow-lg z-50">
          {leftNotice}
        </div>
      )}
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-playhouse-text-secondary text-sm mb-1">Room Code</p>
          <h1 className="font-display text-5xl font-bold tracking-widest font-mono text-playhouse-text-primary">{code}</h1>
          <p className="text-playhouse-text-tertiary text-sm mt-2">Share this code with friends</p>
        </div>

        <div className="bg-playhouse-surface border border-white/[0.06] rounded-2xl p-6 mb-4">
          <h2 className="text-sm text-playhouse-text-secondary mb-3">
            Players ({players.length}{minPlayers > 1 ? `/${minPlayers}+ needed` : ''})
          </h2>
          {players.length === 0 ? (
            <p className="text-playhouse-text-tertiary text-sm">Waiting for players to join…</p>
          ) : (
            <div className="space-y-3">
              {players.map((p) => (
                <div key={p.uid} className="flex items-center gap-3">
                  {p.photoURL && <img src={p.photoURL} alt="" className="w-8 h-8 rounded-full" />}
                  <span className="font-medium text-playhouse-text-primary">{p.displayName}</span>
                  <span className="ml-auto text-xs">
                    {p.uid === hostId
                      ? <span className="text-amber-400">host</span>
                      : readyUids.has(p.uid)
                        ? <span className="text-emerald-400">ready ✓</span>
                        : <span className="text-playhouse-text-tertiary">not ready</span>
                    }
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {!isHost && !isReady && (
            <button
              onClick={handleReady}
              className="w-full py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#e0479e,#a855f7)' }}
            >
              Ready
            </button>
          )}
          {isHost && (
            <button
              onClick={handleStart}
              disabled={!canStart}
              className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}
            >
              {players.length < minPlayers
                ? `Need ${minPlayers - players.length} more player(s)`
                : !allReady
                  ? 'Waiting for players to ready up…'
                  : 'Start Game'}
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 text-playhouse-text-secondary hover:text-playhouse-text-primary transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
