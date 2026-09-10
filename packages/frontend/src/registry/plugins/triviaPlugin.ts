import { lazy } from 'react';
import type { FrontendGamePlugin } from '../gameRegistry';
import type { TriviaContent } from '@games/shared';

const TriviaThemeSelect = lazy(() => import('../../pages/games/trivia/ThemeSelect'));
const TriviaGameBoard = lazy(() => import('../../pages/games/trivia/GameBoard'));
const LocalPlayerSetup = lazy(() => import('../../components/LocalPlayerSetup'));

export const triviaPlugin: FrontendGamePlugin = {
  meta: {
    id: 'trivia',
    displayName: 'Trivia Night',
    description: 'Answer multiple-choice questions. Most correct wins.',
    iconEmoji: '🧠',
    minPlayers: 1,
    maxPlayers: 6,
    supportsLLMGeneration: false,
    supportsMultiplayer: false,
    themeColor: 'violet',
  },
  routes: [
    { path: 'themes', component: TriviaThemeSelect },
    { path: 'local-setup/:themeId', component: LocalPlayerSetup },
    { path: 'play/:themeId', component: TriviaGameBoard },
  ],
  llmInterestPrompts: [],
  parseLLMOutput(): TriviaContent {
    throw new Error('AI generation not supported for trivia yet');
  },
};
