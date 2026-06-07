import {
  buildCatalogPlan,
  formatSyncSummary,
  runCatalogSync,
} from './sync.ts';
import {readCatalogEnv} from './lib/parse-env.ts';
import {aggregateSupplierProducts} from './sourcing/aggregator.ts';
import {scoutTrends} from './ai/trend-scout.ts';
import {formatPromotionSummary, planPromotions} from './ai/promotion-planner.ts';
import {scoreProducts, filterImportCandidates, rankScoredProducts} from './ai/product-scorer.ts';
import {allCollectionHandles} from './config/categories.ts';

function printHelp() {
  console.log(`Lumen Atelier — catalog & dropship automation

Usage:
  npm run catalog:plan
  npm run catalog:sync [-- --dry-run] [--categories-only] [--import-only]
  npm run catalog:smart-sync [-- --dry-run]
  npm run catalog:trends
  npm run catalog:categories

Options:
  --dry-run           Preview without writing to Shopify Admin
  --categories-only   Create/update collections only
  --import-only       Import products only (skip collections)
  --min-score=N       Minimum trending score (default 0)
  --help              Show this help

Environment (.env):
  CATALOG_SYNC_ENABLED=1
  SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...
  CATALOG_SUPPLIER_CSV_PATH=scripts/catalog/feeds/example-products.csv
  FEATURED_COLLECTION_HANDLES=trending-now,beauty-grooming,technology

Smart import (multi-source + cheapest price + AI scoring):
  CATALOG_CHEAPEST_SOURCE_ONLY=1   # default on — max profit per SKU
  CATALOG_TARGET_COUNTRY=IL        # regional trend boost
  CATALOG_AI_ENABLED=1
  CATALOG_AI_API_KEY=...
  CATALOG_MIN_PROFIT_PERCENT=40
  CATALOG_MAX_IMPORT_PER_SYNC=500

Commerce modes: dropshipping, arbitrage, POD, wholesale, marketplace, …
Fulfillment: source_seller — orders route via lumen_dropship.* metafields
`);
}

async function runTrendsOnly(cwd: string) {
  const env = readCatalogEnv(cwd);
  const aggregated = await aggregateSupplierProducts({
    env,
    verticalHandles: allCollectionHandles(),
  });
  const trendScout = await scoutTrends(env, aggregated);
  const scored = rankScoredProducts(
    scoreProducts(env, aggregated, trendScout.signals),
  ).slice(0, 15);
  const promotions = planPromotions(env, scored);

  console.log(
    JSON.stringify(
      {
        region: trendScout.region,
        scannedAt: trendScout.scannedAt,
        signalCount: trendScout.signals.length,
        earlyTrendKeywords: trendScout.earlyTrendKeywords,
        topSignals: trendScout.signals.slice(0, 12),
        topProducts: scored.map((p) => ({
          title: p.title,
          composite: p.scores.composite,
          platform: p.platform,
          matchedTrends: p.matchedTrends,
        })),
        promotions: promotions.slice(0, 10).map((r) => ({
          action: r.action,
          title: r.product.title,
          priority: r.priority,
        })),
      },
      null,
      2,
    ),
  );
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const cwd = process.cwd();
  const dryRun = args.includes('--dry-run');
  const categoriesOnly = args.includes('--categories-only');
  const importOnly = args.includes('--import-only');
  const minScoreArg = args.find((a) => a.startsWith('--min-score='));
  const minTrendingScore = minScoreArg
    ? Number(minScoreArg.split('=')[1])
    : undefined;

  const planOnly =
    process.env.CATALOG_CLI_MODE === 'plan' ||
    args.includes('--plan') ||
    process.argv[1]?.includes('catalog:plan');

  const trendsOnly =
    process.env.CATALOG_CLI_MODE === 'trends' ||
    process.argv[1]?.includes('catalog:trends');

  if (planOnly) {
    const plan = buildCatalogPlan(readCatalogEnv(cwd));
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  if (trendsOnly) {
    await runTrendsOnly(cwd);
    return;
  }

  const report = await runCatalogSync({
    cwd,
    dryRun,
    categoriesOnly,
    importOnly,
    minTrendingScore: Number.isFinite(minTrendingScore)
      ? minTrendingScore
      : undefined,
  });

  console.log(formatSyncSummary(report));
  console.log(`Report: .catalog/reports/latest.json`);
  if (report.smart) {
    console.log(`Promotions: .catalog/reports/latest-promotions.json`);
  }

  const errorCount =
    report.collections.errors.length + report.products.errors.length;
  if (errorCount > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('[catalog:error]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
