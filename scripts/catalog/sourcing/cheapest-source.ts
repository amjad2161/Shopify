import type {AggregatedProduct, CatalogEnv, SupplierProduct} from '../types.ts';
import {productFingerprint} from './fingerprint.ts';

function landedCost(product: SupplierProduct) {
  const raw = product.cost ?? product.price;
  const n = Number(raw);
  if (Number.isNaN(n) || n <= 0) return Infinity;
  const leadPenalty = (product.leadTimeDays ?? 0) * 0.01;
  return n * (1 + leadPenalty);
}

export function pickCheapestPerFingerprint(
  products: SupplierProduct[],
): AggregatedProduct[] {
  const groups = new Map<string, SupplierProduct[]>();

  for (const product of products) {
    const fp = productFingerprint(product);
    const list = groups.get(fp) ?? [];
    list.push(product);
    groups.set(fp, list);
  }

  const winners: AggregatedProduct[] = [];

  for (const [, group] of groups) {
    const sorted = [...group].sort(
      (a, b) => landedCost(a) - landedCost(b),
    );
    const winner = sorted[0];
    const cost = landedCost(winner);

    winners.push({
      ...winner,
      fingerprint: productFingerprint(winner),
      landedCost: cost === Infinity ? 0 : cost,
      cost: winner.cost ?? String(winner.price),
      rejectedSources: sorted.length - 1,
      alternateSources: sorted.slice(1).map((alt) => ({
        platform: alt.platform,
        sellerId: alt.sellerId,
        cost: alt.cost ?? alt.price,
        price: alt.price,
      })),
    });
  }

  return winners;
}

export function isCheapestSourceOnly(env: CatalogEnv) {
  const flag = env.CATALOG_CHEAPEST_SOURCE_ONLY?.trim().toLowerCase();
  if (flag === '0' || flag === 'false' || flag === 'no') return false;
  return true;
}

export function minProfitPercent(env: CatalogEnv, verticalDefault: number) {
  const raw = env.CATALOG_MIN_PROFIT_PERCENT?.trim();
  if (raw) {
    const n = Number(raw);
    if (!Number.isNaN(n) && n >= 0) return n;
  }
  return verticalDefault;
}
