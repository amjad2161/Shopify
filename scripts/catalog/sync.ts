import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {
  CATALOG_VERTICALS,
  allCollectionHandles,
  getAgeRestrictedVerticals,
  getVerticalsByTrending,
} from './config/categories.ts';
import {ShopifyAdminClient} from './lib/admin-client.ts';
import {logInfo, logWarn} from './lib/logger.ts';
import {
  hasAdminCredentials,
  isCatalogSyncEnabled,
  isDryRun,
  readCatalogEnv,
} from './lib/parse-env.ts';
import {ensureCatalogCollections} from './pipelines/ensure-collections.ts';
import {importSupplierProducts} from './pipelines/import-products.ts';
import {getConfiguredAdapters} from './suppliers/registry.ts';
import type {CatalogEnv, SupplierPlatformId, SyncReport} from './types.ts';

export type CatalogSyncOptions = {
  cwd?: string;
  dryRun?: boolean;
  categoriesOnly?: boolean;
  importOnly?: boolean;
  minTrendingScore?: number;
  verticalHandles?: string[];
  platformIds?: SupplierPlatformId[];
};

export type CatalogPlan = {
  syncEnabled: boolean;
  adminReady: boolean;
  dryRunDefault: boolean;
  verticalCount: number;
  collectionHandles: string[];
  ageRestrictedHandles: string[];
  configuredSuppliers: SupplierPlatformId[];
  pendingSuppliers: SupplierPlatformId[];
  featuredCollectionsHint: string[];
};

export function buildCatalogPlan(env: CatalogEnv): CatalogPlan {
  const configured = getConfiguredAdapters(env);
  const configuredIds = configured.map((a) => a.id);
  const allPlatforms = [
    ...new Set(CATALOG_VERTICALS.flatMap((v) => v.supplierPlatforms)),
  ];

  const featuredRaw = env.FEATURED_COLLECTION_HANDLES?.trim();
  const featuredCollectionsHint = featuredRaw
    ? featuredRaw.split(',').map((h) => h.trim()).filter(Boolean)
    : ['trending-now', 'beauty-grooming', 'technology'];

  return {
    syncEnabled: isCatalogSyncEnabled(env),
    adminReady: hasAdminCredentials(env),
    dryRunDefault: isDryRun(env),
    verticalCount: CATALOG_VERTICALS.length,
    collectionHandles: allCollectionHandles(),
    ageRestrictedHandles: getAgeRestrictedVerticals().map((v) => v.handle),
    configuredSuppliers: configuredIds,
    pendingSuppliers: allPlatforms.filter((id) => !configuredIds.includes(id)),
    featuredCollectionsHint,
  };
}

function resolvePlatformIds(
  env: CatalogEnv,
  override?: SupplierPlatformId[],
): SupplierPlatformId[] {
  if (override?.length) return override;

  const configured = new Set(getConfiguredAdapters(env).map((a) => a.id));
  const fromVerticals = new Set(
    CATALOG_VERTICALS.flatMap((v) => v.supplierPlatforms),
  );

  return [...fromVerticals].filter((id) => configured.has(id));
}

export async function runCatalogSync(
  options: CatalogSyncOptions = {},
): Promise<SyncReport> {
  const cwd = options.cwd ?? process.cwd();
  const env = readCatalogEnv(cwd);
  const dryRun = isDryRun(env, options.dryRun);
  const startedAt = new Date().toISOString();

  const verticalHandles =
    options.verticalHandles ?? allCollectionHandles();
  const platformIds = resolvePlatformIds(env, options.platformIds);
  const minTrendingScore = options.minTrendingScore ?? 0;

  const report: SyncReport = {
    dryRun,
    startedAt,
    finishedAt: startedAt,
    collections: {created: 0, updated: 0, skipped: 0, errors: []},
    products: {created: 0, updated: 0, skipped: 0, errors: []},
    fulfillment: {routesConfigured: 0, warnings: []},
  };

  if (!isCatalogSyncEnabled(env) && !dryRun && !options.categoriesOnly) {
    logWarn('CATALOG_SYNC_ENABLED is not set — sync skipped (use --dry-run to preview)');
    report.finishedAt = new Date().toISOString();
    writeSyncReport(cwd, report);
    return report;
  }

  if (!hasAdminCredentials(env) && !dryRun) {
    throw new Error(
      'Missing PUBLIC_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN. ' +
        'Create a custom app in Shopify Admin with write_products + write_collections scopes.',
    );
  }

  const client = hasAdminCredentials(env)
    ? new ShopifyAdminClient(env)
    : null;

  if (platformIds.length === 0 && !options.categoriesOnly) {
    logWarn(
      'No supplier adapters configured — set CATALOG_SUPPLIER_CSV_PATH or supplier API keys',
    );
    report.fulfillment.warnings.push('no-supplier-adapters');
  }

  const ageRestricted = getAgeRestrictedVerticals();
  if (ageRestricted.length > 0) {
    report.fulfillment.warnings.push(
      `age-restricted verticals (${ageRestricted.map((v) => v.handle).join(', ')}) import as DRAFT — enable age gates before publishing`,
    );
  }

  if (!options.importOnly) {
    if (client) {
      report.collections = await ensureCatalogCollections({
        client,
        dryRun,
        minTrendingScore,
      });
    } else {
      logInfo('dry-run plan: collections', {
        count: getVerticalsByTrending(minTrendingScore).length,
      });
      report.collections.skipped = getVerticalsByTrending(minTrendingScore).length;
    }
  }

  if (!options.categoriesOnly && client && platformIds.length > 0) {
    report.products = await importSupplierProducts({
      env,
      client,
      dryRun,
      verticalHandles,
      platformIds,
    });
    report.fulfillment.routesConfigured = report.products.created + report.products.updated;
  } else if (!options.categoriesOnly && platformIds.length > 0) {
    logInfo('dry-run plan: import skipped — admin credentials required for product upsert');
  }

  report.finishedAt = new Date().toISOString();
  writeSyncReport(cwd, report);
  return report;
}

export function writeSyncReport(cwd: string, report: SyncReport) {
  const dir = join(cwd, '.catalog', 'reports');
  if (!existsSync(dir)) mkdirSync(dir, {recursive: true});
  writeFileSync(join(dir, 'latest.json'), JSON.stringify(report, null, 2));
}

export function formatSyncSummary(report: SyncReport) {
  const lines = [
    `Catalog sync ${report.dryRun ? '(dry-run)' : '(live)'}`,
    `Collections: +${report.collections.created} ~${report.collections.updated} skip ${report.collections.skipped}`,
    `Products: +${report.products.created} ~${report.products.updated} skip ${report.products.skipped}`,
  ];

  const errors = [
    ...report.collections.errors,
    ...report.products.errors,
  ];
  if (errors.length) {
    lines.push(`Errors (${errors.length}):`);
    for (const err of errors.slice(0, 8)) lines.push(`  - ${err}`);
    if (errors.length > 8) lines.push(`  … and ${errors.length - 8} more`);
  }

  if (report.fulfillment.warnings.length) {
    lines.push('Warnings:');
    for (const w of report.fulfillment.warnings) lines.push(`  - ${w}`);
  }

  return lines.join('\n');
}
