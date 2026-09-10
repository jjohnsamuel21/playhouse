import type { Server, Socket } from 'socket.io';
import type { ThisOrThatContent } from '@games/shared';
import { SOCKET_EVENTS } from '@games/shared';
import type { ServerGamePlugin, GameSession } from '../gameRegistry';

export const thisOrThatPlugin: ServerGamePlugin = {
  gameId: 'this-or-that',

  validateThemeContent(raw: unknown): ThisOrThatContent {
    const c = raw as Record<string, unknown>;
    if (!Array.isArray(c.pairs)) throw new Error('this-or-that: missing pairs array');
    return { pairs: c.pairs as { a: string; b: string }[] };
  },

  registerSocketHandlers(io: Server, socket: Socket, session: GameSession) {
    socket.on(SOCKET_EVENTS.GAME_ACTION, (payload: { type: string; roundIndex?: number; selected?: number }) => {
      if (payload.type === 'SELECT') {
        const state = session.state as {
          roundIndex: number;
          selections: Record<string, number>;
          playerIds: string[];
        };
        state.selections[socket.data.uid] = payload.selected ?? 0;

        const allAnswered = state.playerIds.every((uid) => uid in state.selections);
        if (allAnswered) {
          io.to(session.roomCode).emit(SOCKET_EVENTS.STATE_UPDATE, {
            state: { ...state, revealResults: true },
          });
        } else {
          socket.emit(SOCKET_EVENTS.STATE_UPDATE, { state });
        }
      }

      if (payload.type === 'NEXT_ROUND') {
        const state = session.state as { roundIndex: number; selections: Record<string, number>; totalRounds: number };
        state.roundIndex += 1;
        state.selections = {};
        if (state.roundIndex >= state.totalRounds) {
          io.to(session.roomCode).emit(SOCKET_EVENTS.GAME_ENDED, { state });
        } else {
          io.to(session.roomCode).emit(SOCKET_EVENTS.STATE_UPDATE, { state });
        }
      }
    });
  },

  computeSessionStats(_session: GameSession, _uid: string) {
    return { gamesPlayed: 1 };
  },
};
