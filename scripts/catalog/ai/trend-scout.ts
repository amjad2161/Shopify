import {getVerticalsByTrending} from '../config/categories.ts';
import type {AggregatedProduct, CatalogEnv, TrendSignal} from '../types.ts';
import {aiComplete, isAiEnabled} from './provider.ts';
import {buildRegionalTrendSignals, resolveTargetRegion} from './regional-adapter.ts';

export type TrendScoutResult = {
  region: string;
  signals: TrendSignal[];
  earlyTrendKeywords: string[];
  scannedAt: string;
};

function earlyTrendHeuristics(products: AggregatedProduct[]): string[] {
  const tags = new Map<string, number>();
  for (const p of products) {
    for (const tag of p.tags) {
      const key = tag.toLowerCase();
      tags.set(key, (tags.get(key) ?? 0) + 1);
    }
  }
  return [...tags.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tag]) => tag);
}

export async function scoutTrends(
  env: CatalogEnv,
  products: AggregatedProduct[] = [],
): Promise<TrendScoutResult> {
  const region = resolveTargetRegion(env);
  const now = new Date().toISOString();
  const signals = buildRegionalTrendSignals(env);

  const topVerticals = getVerticalsByTrending(70);
  for (const v of topVerticals.slice(0, 5)) {
    signals.push({
      keyword: `early:${v.handle}`,
      score: v.trendingScore + 5,
      region,
      source: 'early_detect',
      detectedAt: now,
    });
  }

  let aiKeywords: string[] = [];
  if (isAiEnabled(env)) {
    const verticalNames = topVerticals.map((v) => v.handle).join(', ');
    const content = await aiComplete(env, [
      {
        role: 'system',
        content:
          'You are a global e-commerce trend analyst. Return only a JSON array of 8-15 short search keywords for products trending NOW in the given country. No markdown.',
      },
      {
        role: 'user',
        content: `Country/region: ${region}. Verticals: ${verticalNames}. Output JSON string array only.`,
      },
    ]);

    if (content) {
      try {
        const parsed = JSON.parse(content) as unknown;
        if (Array.isArray(parsed)) {
          aiKeywords = parsed
            .filter((x): x is string => typeof x === 'string')
            .slice(0, 15);
          for (const keyword of aiKeywords) {
            signals.push({
              keyword,
              score: 88,
              region,
              source: 'ai',
              detectedAt: now,
            });
          }
        }
      } catch {
        /* rule-based signals still apply */
      }
    }
  }

  const earlyTrendKeywords = [
    ...earlyTrendHeuristics(products),
    ...aiKeywords,
  ].slice(0, 20);

  return {
    region,
    signals: signals.sort((a, b) => b.score - a.score),
    earlyTrendKeywords,
    scannedAt: now,
  };
}
