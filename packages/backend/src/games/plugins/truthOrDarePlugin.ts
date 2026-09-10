import type { Server, Socket } from 'socket.io';
import type { TruthOrDareContent } from '@games/shared';
import { SOCKET_EVENTS } from '@games/shared';
import type { ServerGamePlugin, GameSession } from '../gameRegistry';

export const truthOrDarePlugin: ServerGamePlugin = {
  gameId: 'truth-or-dare',

  validateThemeContent(raw: unknown): TruthOrDareContent {
    const c = raw as Record<string, unknown>;
    if (!Array.isArray(c.truth) || !Array.isArray(c.dare)) {
      throw new Error('truth-or-dare: missing truth/dare arrays');
    }
    return { truth: c.truth as string[], dare: c.dare as string[] };
  },

  registerSocketHandlers(io: Server, socket: Socket, session: GameSession) {
    socket.on(SOCKET_EVENTS.GAME_ACTION, (payload: {
      type: string;
      question?: string;
      questionType?: string;
    }) => {
      const state = session.state as {
        currentPlayerIndex: number;
        playerIds: string[];
        currentQuestion: string | null;
        currentType: string | null;
      };

      if (payload.type === 'SHOW_QUESTION') {
        state.currentQuestion = payload.question ?? null;
        state.currentType = payload.questionType ?? null;
        io.to(session.roomCode).emit(SOCKET_EVENTS.STATE_UPDATE, { state: { ...state } });
      }

      if (payload.type === 'NEXT_TURN') {
        const activePlayers = state.playerIds;
        if (activePlayers.length === 0) return;
        state.currentPlayerIndex = (state.currentPlayerIndex + 1) % activePlayers.length;
        state.currentQuestion = null;
        state.currentType = null;
        io.to(session.roomCode).emit(SOCKET_EVENTS.STATE_UPDATE, { state: { ...state } });
        io.to(session.roomCode).emit(SOCKET_EVENTS.TURN_CHANGED, {
          currentPlayerUid: activePlayers[state.currentPlayerIndex],
        });
      }
    });
  },

  computeSessionStats(_session: GameSession, _uid: string) {
    return { gamesPlayed: 1 };
  },
};
