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
};
