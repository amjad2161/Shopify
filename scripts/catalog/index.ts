import {buildCatalogPlan, formatSyncSummary, runCatalogSync} from './sync.ts';

function printHelp() {
  console.log(`Lumen Atelier — catalog & dropship automation

Usage:
  npm run catalog:plan
  npm run catalog:sync [-- --dry-run] [--categories-only] [--import-only]
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

Fulfillment model: source_seller — orders route to the original platform seller
via lumen_dropship.* metafields (see scripts/catalog/fulfillment/).
`);
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

  if (planOnly) {
    const {readCatalogEnv} = await import('./lib/parse-env.ts');
    const plan = buildCatalogPlan(readCatalogEnv(cwd));
    console.log(JSON.stringify(plan, null, 2));
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

  const errorCount =
    report.collections.errors.length + report.products.errors.length;
  if (errorCount > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('[catalog:error]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
