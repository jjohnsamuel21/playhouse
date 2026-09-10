import type { Server, Socket } from 'socket.io';
import type { RankingContent } from '@games/shared';
import { SOCKET_EVENTS } from '@games/shared';
import type { ServerGamePlugin, GameSession } from '../gameRegistry';

export const rankingPlugin: ServerGamePlugin = {
  gameId: 'ranking',

  validateThemeContent(raw: unknown): RankingContent {
    const c = raw as Record<string, unknown>;
    if (!Array.isArray(c.items)) throw new Error('ranking: missing items array');
    return { items: c.items as string[] };
  },

  registerSocketHandlers(io: Server, socket: Socket, session: GameSession) {
    socket.on(SOCKET_EVENTS.GAME_ACTION, (payload: { type: string; ranking?: string[] }) => {
      if (payload.type === 'SUBMIT_RANKING') {
        const state = session.state as {
          submissions: Record<string, string[]>;
          playerIds: string[];
        };
        state.submissions[socket.data.uid] = payload.ranking ?? [];

        const allSubmitted = state.playerIds.every((uid) => uid in state.submissions);
        if (allSubmitted) {
          io.to(session.roomCode).emit(SOCKET_EVENTS.GAME_ENDED, { state });
        } else {
          socket.emit(SOCKET_EVENTS.STATE_UPDATE, { state: { waitingFor: state.playerIds.filter((uid) => !(uid in state.submissions)) } });
        }
      }
    });
  },

  computeSessionStats(_session: GameSession, _uid: string) {
    return { gamesPlayed: 1 };
  },
};
