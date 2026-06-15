import {logInfo} from '../lib/logger.ts';
import type {
  AggregatedProduct,
  CatalogEnv,
  SupplierPlatformId,
  SupplierProduct,
} from '../types.ts';
import {getConfiguredAdapters} from '../suppliers/registry.ts';
import {
  isCheapestSourceOnly,
  pickCheapestPerFingerprint,
} from './cheapest-source.ts';

export type AggregateOptions = {
  env: CatalogEnv;
  platformIds?: SupplierPlatformId[];
  verticalHandles: string[];
  limitPerPlatform?: number;
};

/**
 * Pull products from every configured supplier in parallel, then optionally
 * keep only the cheapest source per product fingerprint (max profit).
 */
export async function aggregateSupplierProducts(
  options: AggregateOptions,
): Promise<AggregatedProduct[]> {
  const {env, verticalHandles, limitPerPlatform = 250} = options;
  const adapters = getConfiguredAdapters(env);
  const platformIds =
    options.platformIds ??
    adapters.map((a) => a.id).filter((id) => id !== 'manual');

  const batches = await Promise.all(
    platformIds.map(async (platformId) => {
      const adapter = adapters.find((a) => a.id === platformId);
      if (!adapter) return [] as SupplierProduct[];

      try {
        const batch = await adapter.fetchProducts({
          env,
          verticalHandles,
          limit: limitPerPlatform,
        });
        logInfo(`aggregated ${platformId}`, {count: batch.length});
        return batch;
      } catch (error) {
        logInfo(`aggregator skip ${platformId}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        return [];
      }
    }),
  );

  const flat = batches.flat();

  if (flat.length === 0) return [];

  if (!isCheapestSourceOnly(env)) {
    return flat.map((p) => ({
      ...p,
      fingerprint: `${p.platform}:${p.externalId}`,
      landedCost: Number(p.cost ?? p.price) || 0,
      rejectedSources: 0,
    }));
  }

  return pickCheapestPerFingerprint(flat);
}
