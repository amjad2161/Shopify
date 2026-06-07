import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {formatPromotionSummary, planPromotions} from '../ai/promotion-planner.ts';
import {scoreProducts, filterImportCandidates} from '../ai/product-scorer.ts';
import {scoutTrends} from '../ai/trend-scout.ts';
import {isAiEnabled, hasAiCredentials} from '../ai/provider.ts';
import {logInfo} from '../lib/logger.ts';
import {ShopifyAdminClient} from '../lib/admin-client.ts';
import {aggregateSupplierProducts} from '../sourcing/aggregator.ts';
import {isCheapestSourceOnly} from '../sourcing/cheapest-source.ts';
import type {
  CatalogEnv,
  PromotionRecommendation,
  SupplierPlatformId,
  SyncReport,
  TrendScoutResult,
} from '../types.ts';
import {importScoredProducts} from './import-products.ts';

export type SmartImportResult = SyncReport['products'] & {
  smart: NonNullable<SyncReport['smart']>;
  promotions: PromotionRecommendation[];
  trendScout: TrendScoutResult;
};

export async function runSmartImport(options: {
  env: CatalogEnv;
  client: ShopifyAdminClient;
  dryRun: boolean;
  verticalHandles: string[];
  platformIds: SupplierPlatformId[];
  cwd?: string;
}): Promise<SmartImportResult> {
  const {env, client, dryRun, verticalHandles, platformIds, cwd = process.cwd()} =
    options;

  const aggregated = await aggregateSupplierProducts({
    env,
    platformIds,
    verticalHandles,
  });

  const trendScout = await scoutTrends(env, aggregated);
  const scored = scoreProducts(env, aggregated, trendScout.signals);
  const candidates = filterImportCandidates(env, scored);

  logInfo('smart-import pipeline', {
    aggregated: aggregated.length,
    scored: scored.length,
    candidates: candidates.length,
    region: trendScout.region,
    ai: isAiEnabled(env) && hasAiCredentials(env),
  });

  const productReport = await importScoredProducts({
    env,
    client,
    dryRun,
    products: candidates,
  });

  const promotions = planPromotions(env, candidates);
  writePromotionReport(cwd, promotions, trendScout);

  const smart: NonNullable<SyncReport['smart']> = {
    region: trendScout.region,
    aggregated: aggregated.length,
    scored: scored.length,
    candidates: candidates.length,
    trendSignals: trendScout.signals.length,
    earlyTrendKeywords: trendScout.earlyTrendKeywords,
    promotions: promotions.length,
    aiEnabled: isAiEnabled(env),
    cheapestSourceOnly: isCheapestSourceOnly(env),
  };

  return {
    ...productReport,
    smart,
    promotions,
    trendScout,
  };
}

export function writePromotionReport(
  cwd: string,
  promotions: PromotionRecommendation[],
  trendScout: TrendScoutResult,
) {
  const dir = join(cwd, '.catalog', 'reports');
  if (!existsSync(dir)) mkdirSync(dir, {recursive: true});

  writeFileSync(
    join(dir, 'latest-promotions.json'),
    JSON.stringify(
      {
        scannedAt: trendScout.scannedAt,
        region: trendScout.region,
        earlyTrendKeywords: trendScout.earlyTrendKeywords,
        recommendations: promotions.map((r) => ({
          action: r.action,
          priority: r.priority,
          reason: r.reason,
          title: r.product.title,
          composite: r.product.scores.composite,
          platform: r.product.platform,
        })),
      },
      null,
      2,
    ),
  );
}

export function formatSmartImportSummary(result: SmartImportResult) {
  const lines = [
    `Smart import · region ${result.smart.region}`,
    `  aggregated ${result.smart.aggregated} → scored ${result.smart.scored} → import ${result.smart.candidates}`,
    `  trend signals: ${result.smart.trendSignals} · promotions: ${result.smart.promotions}`,
  ];

  if (result.smart.earlyTrendKeywords.length) {
    lines.push(
      `  early trends: ${result.smart.earlyTrendKeywords.slice(0, 6).join(', ')}`,
    );
  }

  lines.push(formatPromotionSummary(result.promotions));
  return lines.join('\n');
}
