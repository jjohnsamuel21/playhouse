import type { GameId } from '@games/shared';

export interface GameVisual {
  glyph: string;
  gradient: string;
}

export const GAME_VISUALS: Record<GameId, GameVisual> = {
  ranking: {
    glyph: 'R',
    gradient: 'linear-gradient(135deg,#e0479e,#ff8a65)',
  },
  'this-or-that': {
    glyph: 'T',
    gradient: 'linear-gradient(135deg,#a855f7,#6366f1)',
  },
  'truth-or-dare': {
    glyph: 'D',
    gradient: 'linear-gradient(135deg,#e0479e,#a855f7)',
  },
  trivia: {
    glyph: 'Q',
    gradient: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
  },
  'most-likely-to': {
    glyph: 'M',
    gradient: 'linear-gradient(135deg,#6366f1,#22d3ee)',
  },
  'story-builder': {
    glyph: 'S',
    gradient: 'linear-gradient(135deg,#fbbf24,#f472b6)',
  },
};
