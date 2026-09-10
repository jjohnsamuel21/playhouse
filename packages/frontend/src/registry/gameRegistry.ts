import type React from 'react';
import type { GameMeta, ThemeContent } from '@games/shared';
import { truthOrDarePlugin } from './plugins/truthOrDarePlugin';
import { thisOrThatPlugin } from './plugins/thisOrThatPlugin';
import { rankingPlugin } from './plugins/rankingPlugin';
import { triviaPlugin } from './plugins/triviaPlugin';
import { mostLikelyToPlugin } from './plugins/mostLikelyToPlugin';
import { storyBuilderPlugin } from './plugins/storyBuilderPlugin';

export interface RouteDefinition {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType> | React.ComponentType;
}

export interface FrontendGamePlugin {
  meta: GameMeta;
  routes: RouteDefinition[];
  llmInterestPrompts: string[];
  parseLLMOutput(raw: unknown): ThemeContent;
}

const registry = new Map<string, FrontendGamePlugin>();

[truthOrDarePlugin, thisOrThatPlugin, rankingPlugin, triviaPlugin, mostLikelyToPlugin, storyBuilderPlugin].forEach((p) => {
  registry.set(p.meta.id, p);
});

export function getPlugin(gameId: string): FrontendGamePlugin {
  const plugin = registry.get(gameId);
  if (!plugin) throw new Error(`Unknown game: ${gameId}`);
  return plugin;
}

export function getAllPlugins(): FrontendGamePlugin[] {
  return [...registry.values()];
}
