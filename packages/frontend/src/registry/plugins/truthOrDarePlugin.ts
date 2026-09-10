import TodThemeSelect from '../../pages/games/truth-or-dare/ThemeSelect';
import TodGameBoard from '../../pages/games/truth-or-dare/GameBoard';
import LocalPlayerSetup from '../../components/LocalPlayerSetup';
import type { FrontendGamePlugin } from '../gameRegistry';
import type { TruthOrDareContent } from '@games/shared';

export const truthOrDarePlugin: FrontendGamePlugin = {
  meta: {
    id: 'truth-or-dare',
    displayName: 'Truth or Dare',
    description: 'Take turns choosing truth or dare. Themed for couples and groups.',
    iconEmoji: '🎲',
    minPlayers: 2,
    maxPlayers: 4,
    supportsLLMGeneration: true,
    themeColor: 'pink',
  },
  routes: [
    { path: 'themes', component: TodThemeSelect },
    { path: 'local-setup/:themeId', component: LocalPlayerSetup },
    { path: 'play/:themeId', component: TodGameBoard },
  ],
  llmInterestPrompts: [
    'What kind of relationship dynamic do you want to explore?',
    'Should questions lean funny, intimate, or adventurous?',
    'Any topics that are off-limits?',
  ],
  parseLLMOutput(raw): TruthOrDareContent {
    const data = raw as Record<string, unknown>;
    if (!Array.isArray(data.truth) || !Array.isArray(data.dare)) {
      throw new Error('LLM output missing truth or dare arrays');
    }
    return { truth: data.truth as string[], dare: data.dare as string[] };
  },
};
