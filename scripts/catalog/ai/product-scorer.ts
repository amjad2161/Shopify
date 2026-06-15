import {getVerticalByHandle} from '../config/categories.ts';
import type {
  AggregatedProduct,
  CatalogEnv,
  ScoredProduct,
  TrendSignal,
} from '../types.ts';
import {minProfitPercent} from '../sourcing/cheapest-source.ts';
import {regionalKeywordBoost} from './regional-adapter.ts';

function marginScore(product: AggregatedProduct, minMargin: number) {
  const cost = product.landedCost || Number(product.cost ?? product.price);
  const retail = Number(product.price);
  if (!cost || !retail || cost <= 0) return 30;
  const marginPct = ((retail - cost) / cost) * 100;
  if (marginPct < minMargin) return Math.max(0, marginPct);
  return Math.min(100, marginPct * 1.2);
}

function trendMatchScore(
  product: AggregatedProduct,
  signals: TrendSignal[],
): {score: number; matched: string[]} {
  const haystack = [
    product.title,
    ...product.tags,
    product.productType ?? '',
  ]
    .join(' ')
    .toLowerCase();

  const matched: string[] = [];
  let total = 0;
  let weight = 0;

  for (const signal of signals.slice(0, 40)) {
    const kw = signal.keyword.toLowerCase();
    if (haystack.includes(kw) || kw.split(' ').every((w) => haystack.includes(w))) {
      matched.push(signal.keyword);
      total += signal.score;
      weight += 1;
    }
  }

  const score = weight > 0 ? Math.min(100, total / weight) : 35;
  return {score, matched};
}

function demandProxyScore(product: AggregatedProduct) {
  let score = 50;
  if (product.inventoryQuantity > 100) score += 10;
  if (product.rejectedSources > 0) score += 8;
  if (product.imageUrls.length >= 3) score += 5;
  if (product.tags.some((t) => /trend|viral|bestseller/i.test(t))) score += 15;
  return Math.min(100, score);
}

export function scoreProducts(
  env: CatalogEnv,
  products: AggregatedProduct[],
  signals: TrendSignal[],
): ScoredProduct[] {
  return products.map((product) => {
    const vertical = product.categoryHandles[0]
      ? getVerticalByHandle(product.categoryHandles[0])
      : undefined;
    const minMargin = minProfitPercent(env, vertical?.marginPercent ?? 40);
    const {score: trend, matched} = trendMatchScore(product, signals);
    const margin = marginScore(product, minMargin);
    const demand = demandProxyScore(product);
    const regional = regionalKeywordBoost(
      env,
      `${product.title} ${product.tags.join(' ')}`,
    );

    const composite = Math.round(
      trend * 0.35 + margin * 0.3 + demand * 0.2 + regional * 0.15,
    );

    return {
      ...product,
      scores: {trend, margin, demand, regional, composite},
      matchedTrends: matched,
      promote: composite >= 62 && margin >= minMargin * 0.8,
    };
  });
}

export function rankScoredProducts(products: ScoredProduct[]) {
  return [...products].sort(
    (a, b) => b.scores.composite - a.scores.composite,
  );
}

export function filterImportCandidates(
  env: CatalogEnv,
  scored: ScoredProduct[],
): ScoredProduct[] {
  const maxRaw = env.CATALOG_MAX_IMPORT_PER_SYNC?.trim();
  const max = maxRaw ? Number(maxRaw) : 500;
  const limit = Number.isFinite(max) && max > 0 ? max : 500;

  return rankScoredProducts(scored)
    .filter((p) => p.scores.composite >= 45)
    .slice(0, limit);
}
