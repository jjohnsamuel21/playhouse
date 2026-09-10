import RankThemeSelect from '../../pages/games/ranking/ThemeSelect';
import RankGameBoard from '../../pages/games/ranking/GameBoard';
import type { FrontendGamePlugin } from '../gameRegistry';
import type { RankingContent } from '@games/shared';

export const rankingPlugin: FrontendGamePlugin = {
  meta: {
    id: 'ranking',
    displayName: 'Ranking Game',
    description: 'Rank 10 items in order. Compare your list with others.',
    iconEmoji: '🏆',
    minPlayers: 1,
    maxPlayers: 4,
    supportsLLMGeneration: true,
    themeColor: 'amber',
  },
  routes: [
    { path: 'themes', component: RankThemeSelect },
    { path: 'play/:themeId', component: RankGameBoard },
  ],
  llmInterestPrompts: [
    'What topic should be ranked?',
    'Should items be experiences, qualities, or scenarios?',
    'Any themes to avoid?',
  ],
  parseLLMOutput(raw): RankingContent {
    const data = raw as Record<string, unknown>;
    if (!Array.isArray(data.items)) throw new Error('LLM output missing items array');
    return { items: data.items as string[] };
  },
};
