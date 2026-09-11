import type { Server, Socket } from 'socket.io';
import type { TriviaContent } from '@games/shared';
import type { ServerGamePlugin, GameSession } from '../gameRegistry';

export const triviaPlugin: ServerGamePlugin = {
  gameId: 'trivia',

  validateThemeContent(raw: unknown): TriviaContent {
    const c = raw as Record<string, unknown>;
    if (!Array.isArray(c.questions)) throw new Error('trivia: missing questions array');
    return { questions: c.questions as TriviaContent['questions'] };
  },

  // Independent play — each player answers on their own device at their own
  // pace (same real pattern as This-or-That/Ranking multiplayer). No turn
  // sync needed; room membership + chat + host end-game are all handled
  // generically by roomManager.ts.
  registerSocketHandlers(_io: Server, _socket: Socket, _session: GameSession) {},

  computeSessionStats(_session: GameSession, _uid: string) {
    return { gamesPlayed: 1 };
  },
};
