import { lazy } from 'react';
import type { FrontendGamePlugin } from '../gameRegistry';
import type { ThisOrThatContent } from '@games/shared';

const TotThemeSelect = lazy(() => import('../../pages/games/this-or-that/ThemeSelect'));
const TotGameBoard = lazy(() => import('../../pages/games/this-or-that/GameBoard'));
const LocalPlayerSetup = lazy(() => import('../../components/LocalPlayerSetup'));

export const thisOrThatPlugin: FrontendGamePlugin = {
  meta: {
    id: 'this-or-that',
    displayName: 'This or That',
    description: 'Pick one of two options across 20 rounds. Compare choices after.',
    iconEmoji: '⚖️',
    minPlayers: 1,
    maxPlayers: 4,
    supportsLLMGeneration: true,
    supportsMultiplayer: true,
    themeColor: 'cyan',
  },
  routes: [
    { path: 'themes', component: TotThemeSelect },
    { path: 'local-setup/:themeId', component: LocalPlayerSetup },
    { path: 'play/:themeId', component: TotGameBoard },
  ],
  llmInterestPrompts: [
    'What topic should the choices revolve around?',
    'Should options be romantic, adventurous, or lifestyle-focused?',
    'Any themes or topics to avoid?',
  ],
  parseLLMOutput(raw): ThisOrThatContent {
    const data = raw as Record<string, unknown>;
    if (!Array.isArray(data.pairs)) throw new Error('LLM output missing pairs array');
    return {
      pairs: (data.pairs as unknown[]).map((p) =>
        Array.isArray(p) ? { a: String(p[0]), b: String(p[1]) } : (p as { a: string; b: string })
      ),
    };
  },
};
