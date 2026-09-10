import type { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@games/shared';
import type { GameId } from '@games/shared';
import { db } from '../firebase-admin';
import { getPlugin, type GameSession } from '../games/gameRegistry';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface RoomState {
  roomCode: string;
  sessionId: string;
  gameId: GameId;
  hostId: string;
  playerIds: string[];
  maxPlayers: number;
  status: 'waiting' | 'active' | 'closed';
  players: Map<string, { displayName: string; photoURL: string; isReady: boolean }>;
  sockets: Map<string, Socket>;
  session: GameSession;
  idleTimer?: NodeJS.Timeout;
}

const rooms = new Map<string, RoomState>();

async function flushSession(session: GameSession): Promise<void> {
  await db.collection('sessions').doc(session.sessionId).update({ state: session.state });
}

function registerPluginHandlers(io: Server, socket: Socket, room: RoomState): void {
  const plugin = getPlugin(room.gameId);
  plugin.registerSocketHandlers(io, socket, room.session);
}

function resetIdleTimer(io: Server, room: RoomState): void {
  if (room.idleTimer) clearTimeout(room.idleTimer);
  if (room.status !== 'active') return;

  room.idleTimer = setTimeout(() => {
    if (room.status !== 'active') return;

    const state = room.session.state as {
      currentPlayerIndex: number;
      playerIds: string[];
      currentQuestion: string | null;
      currentType: string | null;
    };

    if (!Array.isArray(state.playerIds) || state.playerIds.length === 0) return;

    const skippedUid = state.playerIds[state.currentPlayerIndex];
    const skippedName = room.players.get(skippedUid)?.displayName ?? 'A player';

    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerIds.length;
    state.currentQuestion = null;
    state.currentType = null;

    io.to(room.roomCode).emit(SOCKET_EVENTS.STATE_UPDATE, { state: { ...state } });
    io.to(room.roomCode).emit(SOCKET_EVENTS.PLAYER_SKIPPED, {
      uid: skippedUid,
      displayName: skippedName,
      reason: 'idle',
    });

    flushSession(room.session).catch(console.error);
    // Reset timer for next player
    resetIdleTimer(io, room);
  }, IDLE_TIMEOUT_MS);
}

function clearIdleTimer(room: RoomState): void {
  if (room.idleTimer) {
    clearTimeout(room.idleTimer);
    room.idleTimer = undefined;
  }
}

export function registerRoomHandlers(io: Server, socket: Socket): void {
  const uid: string = socket.data.uid;
  const displayName: string = socket.data.displayName ?? 'Player';
  const photoURL: string = socket.data.photoURL ?? '';

  // ── JOIN_ROOM ─────────────────────────────────────────────────────────────

  socket.on(SOCKET_EVENTS.JOIN_ROOM, async ({ roomCode }: { roomCode: string }) => {
    const roomSnap = await db.collection('rooms').doc(roomCode).get();
    if (!roomSnap.exists) {
      socket.emit(SOCKET_EVENTS.ERROR, { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
      return;
    }

    const roomData = roomSnap.data()!;

    if (!rooms.has(roomCode)) {
      const sessionSnap = await db.collection('sessions').doc(roomData.sessionId).get();
      const sessionData = sessionSnap.data() ?? {};
      const session: GameSession = {
        sessionId: roomData.sessionId,
        roomCode,
        gameId: roomData.gameId,
        themeId: sessionData.themeId ?? '',
        hostId: roomData.hostId,
        playerIds: roomData.playerIds ?? [],
        state: sessionData.state ?? {},
      };
      rooms.set(roomCode, {
        roomCode,
        sessionId: roomData.sessionId,
        gameId: roomData.gameId,
        hostId: roomData.hostId,
        playerIds: roomData.playerIds ?? [],
        maxPlayers: roomData.maxPlayers ?? 8,
        status: roomData.status,
        players: new Map(),
        sockets: new Map(),
        session,
      });
    }

    const room = rooms.get(roomCode)!;

    if (room.status === 'closed') {
      socket.emit(SOCKET_EVENTS.ERROR, { code: 'ROOM_CLOSED', message: 'Room is closed' });
      return;
    }

    if (!room.playerIds.includes(uid)) {
      if (room.playerIds.length >= room.maxPlayers) {
        socket.emit(SOCKET_EVENTS.ERROR, { code: 'ROOM_FULL', message: 'Room is full' });
        return;
      }
      room.playerIds.push(uid);
      await db.collection('rooms').doc(roomCode).update({ playerIds: room.playerIds });
    }

    room.players.set(uid, { displayName, photoURL, isReady: false });
    room.sockets.set(uid, socket);
    socket.data.roomCode = roomCode;
    await socket.join(roomCode);

    if (room.status === 'active') {
      registerPluginHandlers(io, socket, room);
    }

    socket.emit('ROOM_META', {
      gameId: room.gameId,
      hostId: room.hostId,
      themeId: room.session.themeId,
      players: Array.from(room.players.entries()).map(([pUid, p]) => ({
        uid: pUid,
        displayName: p.displayName,
        photoURL: p.photoURL,
      })),
    });

    io.to(roomCode).emit(SOCKET_EVENTS.PLAYER_JOINED, {
      uid,
      displayName,
      photoURL,
      playerCount: room.players.size,
    });

    if (room.status === 'active') {
      const state = room.session.state as { playerIds?: string[] };
      socket.emit(SOCKET_EVENTS.GAME_STARTED, {
        sessionId: room.sessionId,
        themeId: room.session.themeId,
        playerIds: state.playerIds ?? room.playerIds,
        hostId: room.hostId,
      });
    }
  });

  // ── PLAYER_READY ──────────────────────────────────────────────────────────

  socket.on(SOCKET_EVENTS.PLAYER_READY, () => {
    const roomCode: string = socket.data.roomCode;
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.get(uid);
    if (player) {
      player.isReady = true;
      io.to(roomCode).emit(SOCKET_EVENTS.PLAYER_READY, { uid });
    }
  });

  // ── START_GAME ────────────────────────────────────────────────────────────

  socket.on(SOCKET_EVENTS.START_GAME, async () => {
    const roomCode: string = socket.data.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== uid) return;

    // All non-host players must be ready
    const notReady = Array.from(room.players.entries())
      .filter(([pUid, p]) => pUid !== uid && !p.isReady)
      .map(([, p]) => p.displayName);
    if (notReady.length > 0) {
      socket.emit(SOCKET_EVENTS.ERROR, {
        code: 'NOT_ALL_READY',
        message: `Waiting for: ${notReady.join(', ')}`,
      });
      return;
    }

    room.status = 'active';
    room.session.playerIds = room.playerIds;

    room.session.state = {
      currentPlayerIndex: 0,
      playerIds: [...room.playerIds],
      currentQuestion: null,
      currentType: null,
      selections: {},
      submissions: {},
      roundIndex: 0,
    };

    for (const [, playerSocket] of room.sockets) {
      registerPluginHandlers(io, playerSocket, room);
    }

    await db.collection('rooms').doc(roomCode).update({ status: 'active' });
    await db.collection('sessions').doc(room.sessionId).update({
      status: 'active',
      playerIds: room.playerIds,
    });

    io.to(roomCode).emit(SOCKET_EVENTS.GAME_STARTED, {
      sessionId: room.sessionId,
      themeId: room.session.themeId,
      playerIds: room.playerIds,
      hostId: room.hostId,
    });

    await flushSession(room.session);
    resetIdleTimer(io, room);
  });

  // ── GAME_ACTION intercept — reset idle timer on any player action ─────────

  socket.on(SOCKET_EVENTS.GAME_ACTION, () => {
    const roomCode: string = socket.data.roomCode;
    const room = rooms.get(roomCode);
    if (room?.status === 'active') resetIdleTimer(io, room);
  });

  // ── CHAT ──────────────────────────────────────────────────────────────────

  socket.on(SOCKET_EVENTS.SEND_CHAT, ({ message, type }: { message: string; type: 'text' | 'emote' }) => {
    const roomCode: string = socket.data.roomCode;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    const payload = {
      uid,
      displayName,
      photoURL,
      message: String(message).slice(0, 500),
      type,
      timestamp: Date.now(),
    };

    io.to(roomCode).emit(SOCKET_EVENTS.CHAT_MESSAGE, payload);

    db.collection('sessions').doc(room.sessionId).collection('chat').add({
      ...payload,
      createdAt: new Date(),
    }).catch(console.error);
  });

  // ── END_GAME (host only) ──────────────────────────────────────────────────

  socket.on(SOCKET_EVENTS.END_GAME, async () => {
    const roomCode: string = socket.data.roomCode;
    const room = rooms.get(roomCode);
    if (!room) return;
    if (uid !== room.hostId) return; // only host can end

    clearIdleTimer(room);

    await db.collection('sessions').doc(room.sessionId).update({
      status: 'finished',
      finishedAt: new Date(),
      state: room.session.state,
    });
    await db.collection('rooms').doc(roomCode).update({ status: 'closed' });

    io.to(roomCode).emit(SOCKET_EVENTS.GAME_ENDED, { endedBy: uid, displayName });
    rooms.delete(roomCode);
  });

  // ── DISCONNECT ────────────────────────────────────────────────────────────

  socket.on('disconnect', async () => {
    const roomCode: string = socket.data.roomCode;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    room.players.delete(uid);
    room.sockets.delete(uid);

    let newHostId: string | null = null;
    if (uid === room.hostId && room.players.size > 0) {
      newHostId = Array.from(room.players.keys())[0];
      room.hostId = newHostId;
      room.session.hostId = newHostId;
    }

    if (room.status === 'active') {
      const state = room.session.state as {
        currentPlayerIndex: number;
        playerIds: string[];
        currentQuestion: string | null;
        currentType: string | null;
      };

      if (Array.isArray(state.playerIds)) {
        const wasCurrentPlayer = state.playerIds[state.currentPlayerIndex] === uid;
        state.playerIds = state.playerIds.filter((id) => id !== uid);

        if (state.playerIds.length === 0) {
          clearIdleTimer(room);
          rooms.delete(roomCode);
          await db.collection('rooms').doc(roomCode).update({ status: 'closed' });
          return;
        }

        state.currentPlayerIndex = Math.min(state.currentPlayerIndex, state.playerIds.length - 1);
        if (wasCurrentPlayer) {
          state.currentQuestion = null;
          state.currentType = null;
          // Reset idle timer since turn just changed
          resetIdleTimer(io, room);
        }

        io.to(roomCode).emit(SOCKET_EVENTS.STATE_UPDATE, { state: { ...state } });
      }
    }

    io.to(roomCode).emit(SOCKET_EVENTS.PLAYER_LEFT, {
      uid,
      playerCount: room.players.size,
      newHostId,
    });

    if (room.players.size === 0) {
      clearIdleTimer(room);
      rooms.delete(roomCode);
      await db.collection('rooms').doc(roomCode).update({ status: 'closed' });
    }
  });
}

export async function recoverActiveRooms(): Promise<void> {
  const snap = await db.collection('rooms').where('status', '==', 'active').get();
  for (const doc of snap.docs) {
    const data = doc.data();
    const sessionSnap = await db.collection('sessions').doc(data.sessionId).get();
    const sessionData = sessionSnap.data() ?? {};
    const session: GameSession = {
      sessionId: data.sessionId,
      roomCode: doc.id,
      gameId: data.gameId,
      themeId: sessionData.themeId ?? '',
      hostId: data.hostId,
      playerIds: data.playerIds ?? [],
      state: sessionData.state ?? {},
    };
    rooms.set(doc.id, {
      roomCode: doc.id,
      sessionId: data.sessionId,
      gameId: data.gameId,
      hostId: data.hostId,
      playerIds: data.playerIds ?? [],
      maxPlayers: data.maxPlayers ?? 8,
      status: 'active',
      players: new Map(),
      sockets: new Map(),
      session,
    });
  }
}
