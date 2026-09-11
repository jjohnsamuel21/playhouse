import type { Server, Socket } from 'socket.io';
import type { MostLikelyToContent } from '@games/shared';
import { SOCKET_EVENTS } from '@games/shared';
import type { ServerGamePlugin, GameSession } from '../gameRegistry';

interface MostLikelyToState {
  promptIndex?: number;
  promptText?: string | null;
  votes?: Record<string, string>;
}

export const mostLikelyToPlugin: ServerGamePlugin = {
  gameId: 'most-likely-to',

  validateThemeContent(raw: unknown): MostLikelyToContent {
    const c = raw as Record<string, unknown>;
    if (!Array.isArray(c.prompts)) throw new Error('most-likely-to: missing prompts array');
    return { prompts: c.prompts as string[] };
  },

  registerSocketHandlers(io: Server, socket: Socket, session: GameSession) {
    socket.on(SOCKET_EVENTS.GAME_ACTION, (payload: {
      type: string;
      promptIndex?: number;
      promptText?: string;
      votedForUid?: string;
    }) => {
      const state = session.state as MostLikelyToState;

      // Host sends the next prompt — host's frontend already has the full
      // prompts[] from its own Firestore theme fetch, same as solo mode.
      if (payload.type === 'SHOW_PROMPT') {
        state.promptIndex = payload.promptIndex ?? 0;
        state.promptText = payload.promptText ?? null;
        state.votes = {};
        io.to(session.roomCode).emit(SOCKET_EVENTS.STATE_UPDATE, { state: { ...state } });
      }

      if (payload.type === 'VOTE') {
        if (!state.votes) state.votes = {};
        state.votes[socket.data.uid] = payload.votedForUid ?? '';
        io.to(session.roomCode).emit(SOCKET_EVENTS.STATE_UPDATE, { state: { ...state } });
      }
    });
  },

  computeSessionStats(_session: GameSession, _uid: string) {
    return { gamesPlayed: 1 };
  },
};
