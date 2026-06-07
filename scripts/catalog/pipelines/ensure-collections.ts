import {CATALOG_VERTICALS} from '../config/categories.ts';
import {
  ensureCollection,
  ShopifyAdminClient,
} from '../lib/admin-client.ts';
import {logInfo} from '../lib/logger.ts';
import type {SyncReport} from '../types.ts';

export async function ensureCatalogCollections(options: {
  client: ShopifyAdminClient;
  dryRun: boolean;
  minTrendingScore?: number;
}) {
  const {client, dryRun, minTrendingScore = 0} = options;
  const report: SyncReport['collections'] = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  const verticals = CATALOG_VERTICALS.filter(
    (v) => v.trendingScore >= minTrendingScore,
  );

  for (const vertical of verticals) {
    const seoDescription = [
      vertical.description,
      `Keywords: ${vertical.seoKeywords.slice(0, 6).join(', ')}`,
    ].join(' ');

    try {
      const result = await ensureCollection(
        client,
        {
          handle: vertical.handle,
          title: vertical.title.en,
          descriptionHtml: `<p>${vertical.description}</p>`,
          seo: {
            title: `${vertical.title.en} | OneClick Hub`,
            description: seoDescription.slice(0, 320),
          },
        },
        dryRun,
      );

      if (result.action === 'created') report.created++;
      else if (result.action === 'updated') report.updated++;
      else report.skipped++;

      logInfo(`collection ${vertical.handle}`, {
        action: result.action,
        ageRestricted: vertical.ageRestricted,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      report.errors.push(`${vertical.handle}: ${message}`);
    }
  }

  return report;
}
