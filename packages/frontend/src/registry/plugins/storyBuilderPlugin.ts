import { lazy } from 'react';
import type { FrontendGamePlugin } from '../gameRegistry';
import type { StoryBuilderContent } from '@games/shared';

const StoryThemeSelect = lazy(() => import('../../pages/games/story-builder/ThemeSelect'));
const StoryGameBoard = lazy(() => import('../../pages/games/story-builder/GameBoard'));
const LocalPlayerSetup = lazy(() => import('../../components/LocalPlayerSetup'));

export const storyBuilderPlugin: FrontendGamePlugin = {
  meta: {
    id: 'story-builder',
    displayName: 'Story Builder',
    description: 'Take turns adding one line to a shared story.',
    iconEmoji: '📖',
    minPlayers: 2,
    maxPlayers: 6,
    supportsLLMGeneration: false,
    supportsMultiplayer: true,
    themeColor: 'cyan',
  },
  routes: [
    { path: 'themes', component: StoryThemeSelect },
    { path: 'local-setup/:themeId', component: LocalPlayerSetup },
    { path: 'play/:themeId', component: StoryGameBoard },
  ],
  llmInterestPrompts: [],
  parseLLMOutput(): StoryBuilderContent {
    throw new Error('AI generation not supported for story-builder yet');
  },
};
