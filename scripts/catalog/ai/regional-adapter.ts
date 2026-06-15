import {CATALOG_VERTICALS} from '../config/categories.ts';
import type {CatalogEnv, TrendSignal} from '../types.ts';

/** Regional keyword boosts — extend via AI or market data feeds. */
const REGION_KEYWORDS: Record<string, string[]> = {
  IL: ['ישראל', 'משלוח מהיר', 'שקל', 'טרנדי בישראל', 'tiktok israel'],
  US: ['usa shipping', 'amazon prime style', 'memorial day sale', 'tiktok viral us'],
  CA: ['canada shipping', 'cad', 'bilingual en fr', 'tiktok canada'],
  GB: ['uk shipping', 'gbp', 'royal mail', 'tiktok uk'],
  DE: ['deutschland', 'eu shipping', 'tiktok germany'],
  FR: ['france livraison', 'tiktok france', 'tendance'],
};

export function resolveTargetRegion(env: CatalogEnv) {
  return (
    env.CATALOG_TARGET_COUNTRY?.trim().toUpperCase() ||
    env.CATALOG_TARGET_REGION?.trim().toUpperCase() ||
    'GLOBAL'
  );
}

export function resolveTargetLocale(env: CatalogEnv) {
  return env.CATALOG_TARGET_LOCALE?.trim() || 'en';
}

export function buildRegionalTrendSignals(env: CatalogEnv): TrendSignal[] {
  const region = resolveTargetRegion(env);
  const now = new Date().toISOString();
  const signals: TrendSignal[] = [];

  const regionalExtras = REGION_KEYWORDS[region] ?? [];
  for (const keyword of regionalExtras) {
    signals.push({
      keyword,
      score: 75,
      region,
      source: 'seo',
      detectedAt: now,
    });
  }

  for (const vertical of CATALOG_VERTICALS) {
    const boost = vertical.trendingScore;
    for (const kw of vertical.seoKeywords.slice(0, 4)) {
      signals.push({
        keyword: kw,
        score: Math.min(100, boost),
        region,
        source: 'vertical',
        detectedAt: now,
      });
    }
  }

  return signals;
}

export function regionalKeywordBoost(
  env: CatalogEnv,
  productText: string,
): number {
  const region = resolveTargetRegion(env);
  if (region === 'GLOBAL') return 50;

  const extras = REGION_KEYWORDS[region] ?? [];
  const haystack = productText.toLowerCase();
  let hits = 0;
  for (const kw of extras) {
    if (haystack.includes(kw.toLowerCase())) hits++;
  }
  return Math.min(100, 40 + hits * 15);
}
