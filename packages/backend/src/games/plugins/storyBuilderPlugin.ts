import type { Server, Socket } from 'socket.io';
import type { StoryBuilderContent } from '@games/shared';
import { SOCKET_EVENTS } from '@games/shared';
import type { ServerGamePlugin, GameSession } from '../gameRegistry';

const TOTAL_LINES = 12;

interface StoryBuilderState {
  currentPlayerIndex: number;
  playerIds: string[];
  lines?: { text: string; uid: string }[];
}

export const storyBuilderPlugin: ServerGamePlugin = {
  gameId: 'story-builder',

  validateThemeContent(raw: unknown): StoryBuilderContent {
    const c = raw as Record<string, unknown>;
    if (typeof c.starter !== 'string') throw new Error('story-builder: missing starter string');
    return { starter: c.starter };
  },

  registerSocketHandlers(io: Server, socket: Socket, session: GameSession) {
    socket.on(SOCKET_EVENTS.GAME_ACTION, (payload: { type: string; text?: string }) => {
      if (payload.type !== 'ADD_LINE') return;

      const state = session.state as unknown as StoryBuilderState;
      if (!Array.isArray(state.playerIds) || state.playerIds.length === 0) return;
      if ((state.lines?.length ?? 0) >= TOTAL_LINES) return; // story already complete

      // Only the current-turn player's line is accepted.
      if (state.playerIds[state.currentPlayerIndex] !== socket.data.uid) return;

      const text = (payload.text ?? '').trim();
      if (!text) return;

      state.lines = [...(state.lines ?? []), { text, uid: socket.data.uid }];
      state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerIds.length;

      // Always broadcast STATE_UPDATE (even once lines.length hits TOTAL_LINES) —
      // the host's frontend detects completion and calls the existing generic
      // endGame(), keeping the GAME_ENDED payload shape ({endedBy, displayName})
      // consistent with how every other game ends a session.
      io.to(session.roomCode).emit(SOCKET_EVENTS.STATE_UPDATE, { state: { ...state } });
    });
  },

  computeSessionStats(_session: GameSession, _uid: string) {
    return { gamesPlayed: 1 };
  },
};
