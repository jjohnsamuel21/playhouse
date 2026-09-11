import { lazy } from 'react';
import type { FrontendGamePlugin } from '../gameRegistry';
import type { MostLikelyToContent } from '@games/shared';

const MltThemeSelect = lazy(() => import('../../pages/games/most-likely-to/ThemeSelect'));
const MltGameBoard = lazy(() => import('../../pages/games/most-likely-to/GameBoard'));
const LocalPlayerSetup = lazy(() => import('../../components/LocalPlayerSetup'));

export const mostLikelyToPlugin: FrontendGamePlugin = {
  meta: {
    id: 'most-likely-to',
    displayName: 'Most Likely To',
    description: 'Vote who in the group fits each prompt best.',
    iconEmoji: '🫵',
    minPlayers: 3,
    maxPlayers: 8,
    supportsLLMGeneration: false,
    supportsMultiplayer: true,
    themeColor: 'indigo',
  },
  routes: [
    { path: 'themes', component: MltThemeSelect },
    { path: 'local-setup/:themeId', component: LocalPlayerSetup },
    { path: 'play/:themeId', component: MltGameBoard },
  ],
  llmInterestPrompts: [],
  parseLLMOutput(): MostLikelyToContent {
    throw new Error('AI generation not supported for most-likely-to yet');
  },
};
