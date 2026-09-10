import type { Server, Socket } from 'socket.io';
import type { GameId, ThemeContent } from '@games/shared';
import { truthOrDarePlugin } from './plugins/truthOrDarePlugin';
import { thisOrThatPlugin } from './plugins/thisOrThatPlugin';
import { rankingPlugin } from './plugins/rankingPlugin';

export interface GameSession {
  sessionId: string;
  roomCode: string;
  gameId: GameId;
  themeId: string;
  hostId: string;
  playerIds: string[];
  state: Record<string, unknown>;
}

export interface ServerGamePlugin {
  gameId: GameId;
  validateThemeContent(content: unknown): ThemeContent;
  registerSocketHandlers(io: Server, socket: Socket, session: GameSession): void;
  computeSessionStats(session: GameSession, uid: string): Record<string, unknown>;
}

const plugins: Map<GameId, ServerGamePlugin> = new Map([
  ['truth-or-dare', truthOrDarePlugin],
  ['this-or-that', thisOrThatPlugin],
  ['ranking', rankingPlugin],
]);

export function getPlugin(gameId: GameId): ServerGamePlugin {
  const p = plugins.get(gameId);
  if (!p) throw new Error(`No server plugin for gameId: ${gameId}`);
  return p;
}

export function getAllPlugins(): ServerGamePlugin[] {
  return Array.from(plugins.values());
}
