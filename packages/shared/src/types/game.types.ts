import type { Timestamp } from 'firebase/firestore';

export type GameId = 'ranking' | 'this-or-that' | 'truth-or-dare' | 'trivia' | 'most-likely-to' | 'story-builder';
export type Visibility = 'public' | 'private';
export type SessionStatus = 'waiting' | 'active' | 'finished';

// ── Theme content shapes per game ─────────────────────────────────────────────

export interface TruthOrDareContent {
  truth: string[];
  dare: string[];
}

export interface ThisOrThatContent {
  pairs: { a: string; b: string }[];
}

export interface RankingContent {
  items: string[];
}

export interface TriviaContent {
  questions: { question: string; options: string[]; correctIndex: number }[];
}

export interface MostLikelyToContent {
  prompts: string[];
}

export interface StoryBuilderContent {
  starter: string;
}

export type ThemeContent =
  | TruthOrDareContent
  | ThisOrThatContent
  | RankingContent
  | TriviaContent
  | MostLikelyToContent
  | StoryBuilderContent;

// ── Firestore documents ───────────────────────────────────────────────────────

export interface ThemeDoc {
  gameId: GameId;
  name: string;
  description: string;
  tags: string[];
  visibility: Visibility;
  ownerId: string | null;
  isLLMGenerated: boolean;
  content: ThemeContent;
  createdAt: Timestamp;
}

export interface PlayerState {
  uid: string;
  displayName: string;
  photoURL: string;
  isReady: boolean;
  data: Record<string, unknown>;
}

export interface SessionDoc {
  gameId: GameId;
  themeId: string;
  roomId: string | null;
  hostId: string;
  playerIds: string[];
  status: SessionStatus;
  state: Record<string, unknown>;
  createdAt: Timestamp;
  finishedAt: Timestamp | null;
}

export interface RoomDoc {
  sessionId: string;
  hostId: string;
  gameId: GameId;
  playerIds: string[];
  maxPlayers: number;
  status: 'waiting' | 'active' | 'closed';
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export interface UserStats {
  gamesPlayed: number;
  totalRoundsPlayed: number;
  favoriteGame: GameId | null;
  lastPlayedAt: Timestamp | null;
}

export interface UserDoc {
  displayName: string;
  email: string;
  photoURL: string;
  createdAt: Timestamp;
  stats: UserStats;
}

export interface GameHistoryDoc {
  uid: string;
  sessionId: string;
  gameId: GameId;
  themeId: string;
  themeName: string;
  result: Record<string, unknown>;
  playedAt: Timestamp;
}

// ── Game plugin interface (frontend) ─────────────────────────────────────────

export type GameThemeColor = 'violet' | 'cyan' | 'pink' | 'amber' | 'indigo';

export interface GameMeta {
  id: GameId;
  displayName: string;
  description: string;
  iconEmoji: string;
  minPlayers: number;
  maxPlayers: number;
  supportsLLMGeneration: boolean;
  supportsMultiplayer: boolean;
  themeColor: GameThemeColor;
}

// ── Socket event payloads ─────────────────────────────────────────────────────

export interface JoinRoomPayload {
  roomCode: string;
}

export interface PlayerJoinedPayload {
  uid: string;
  displayName: string;
  photoURL: string;
  playerCount: number;
}

export interface GameStartedPayload {
  sessionId: string;
  themeId: string;
  playerIds: string[];
}

export interface StateUpdatePayload {
  state: Record<string, unknown>;
}

export interface GameActionPayload {
  type: string;
  [key: string]: unknown;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

export const SOCKET_EVENTS = {
  // client → server
  JOIN_ROOM: 'JOIN_ROOM',
  PLAYER_READY: 'PLAYER_READY',
  START_GAME: 'START_GAME',
  GAME_ACTION: 'GAME_ACTION',
  SEND_CHAT: 'SEND_CHAT',
  END_GAME: 'END_GAME',
  // server → client
  PLAYER_JOINED: 'PLAYER_JOINED',
  PLAYER_LEFT: 'PLAYER_LEFT',
  ROOM_READY: 'ROOM_READY',
  GAME_STARTED: 'GAME_STARTED',
  STATE_UPDATE: 'STATE_UPDATE',
  TURN_CHANGED: 'TURN_CHANGED',
  GAME_ENDED: 'GAME_ENDED',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  PLAYER_SKIPPED: 'PLAYER_SKIPPED',
  ERROR: 'ERROR',
} as const;

export interface ChatMessage {
  uid: string;
  displayName: string;
  photoURL: string;
  message: string;
  type: 'text' | 'emote';
  timestamp: number;
}
