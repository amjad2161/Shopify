import {getVerticalByHandle} from '../config/categories.ts';
import {DROPSHIP_METAFIELD_NAMESPACE} from '../config/metafields.ts';
import {
  findProductBySourceId,
  ShopifyAdminClient,
  upsertProduct,
} from '../lib/admin-client.ts';
import {defaultMarginPercent} from '../lib/parse-env.ts';
import {logInfo, logWarn} from '../lib/logger.ts';
import {fetchAllSupplierProducts} from '../suppliers/registry.ts';
import type {
  CatalogEnv,
  ScoredProduct,
  SupplierPlatformId,
  SupplierProduct,
  SyncReport,
} from '../types.ts';

function applyMargin(price: string, marginPercent: number) {
  const base = Number(price);
  if (Number.isNaN(base) || base <= 0) return price;
  const retail = base * (1 + marginPercent / 100);
  return retail.toFixed(2);
}

function productToMetafields(
  product: SupplierProduct,
  verticalAgeRestricted: boolean,
  scored?: ScoredProduct,
) {
  const entries: Array<{
    namespace: string;
    key: string;
    type: string;
    value: string;
  }> = [
    {
      namespace: DROPSHIP_METAFIELD_NAMESPACE,
      key: 'source_platform',
      type: 'single_line_text_field',
      value: product.platform,
    },
    {
      namespace: DROPSHIP_METAFIELD_NAMESPACE,
      key: 'source_product_id',
      type: 'single_line_text_field',
      value: product.externalId,
    },
    {
      namespace: DROPSHIP_METAFIELD_NAMESPACE,
      key: 'source_seller_id',
      type: 'single_line_text_field',
      value: product.sellerId,
    },
    {
      namespace: DROPSHIP_METAFIELD_NAMESPACE,
      key: 'fulfillment_mode',
      type: 'single_line_text_field',
      value: 'source_seller',
    },
    {
      namespace: DROPSHIP_METAFIELD_NAMESPACE,
      key: 'age_restricted',
      type: 'boolean',
      value: verticalAgeRestricted ? 'true' : 'false',
    },
  ];

  if (product.sellerName) {
    entries.push({
      namespace: DROPSHIP_METAFIELD_NAMESPACE,
      key: 'source_seller_name',
      type: 'single_line_text_field',
      value: product.sellerName,
    });
  }

  if (product.sourceUrl) {
    entries.push({
      namespace: DROPSHIP_METAFIELD_NAMESPACE,
      key: 'source_url',
      type: 'url',
      value: product.sourceUrl,
    });
  }

  if (product.cost) {
    entries.push({
      namespace: DROPSHIP_METAFIELD_NAMESPACE,
      key: 'cost_amount',
      type: 'single_line_text_field',
      value: product.cost,
    });
  }

  if (product.leadTimeDays != null) {
    entries.push({
      namespace: DROPSHIP_METAFIELD_NAMESPACE,
      key: 'lead_time_days',
      type: 'number_integer',
      value: String(product.leadTimeDays),
    });
  }

  if (scored) {
    entries.push(
      {
        namespace: DROPSHIP_METAFIELD_NAMESPACE,
        key: 'ai_composite_score',
        type: 'number_integer',
        value: String(Math.round(scored.scores.composite)),
      },
      {
        namespace: DROPSHIP_METAFIELD_NAMESPACE,
        key: 'ai_trend_score',
        type: 'number_integer',
        value: String(Math.round(scored.scores.trend)),
      },
      {
        namespace: DROPSHIP_METAFIELD_NAMESPACE,
        key: 'matched_trends',
        type: 'single_line_text_field',
        value: scored.matchedTrends.slice(0, 8).join(', '),
      },
      {
        namespace: DROPSHIP_METAFIELD_NAMESPACE,
        key: 'rejected_sources_count',
        type: 'number_integer',
        value: String(scored.rejectedSources ?? 0),
      },
    );

    if (scored.alternateSources?.length) {
      entries.push({
        namespace: DROPSHIP_METAFIELD_NAMESPACE,
        key: 'alternate_sources_json',
        type: 'json',
        value: JSON.stringify(scored.alternateSources.slice(0, 5)),
      });
    }
  }

  return entries;
}

async function upsertOneProduct(
  options: {
    env: CatalogEnv;
    client: ShopifyAdminClient;
    dryRun: boolean;
    product: SupplierProduct;
    scored?: ScoredProduct;
  },
  report: SyncReport['products'],
) {
  const {env, client, dryRun, product, scored} = options;
  const primaryHandle = product.categoryHandles[0];
  const vertical = primaryHandle
    ? getVerticalByHandle(primaryHandle)
    : undefined;
  const margin = vertical
    ? defaultMarginPercent(env, vertical.marginPercent)
    : defaultMarginPercent(env, 45);

  const retailPrice = applyMargin(product.price, margin);
  let status = vertical?.ageRestricted ? 'DRAFT' : 'ACTIVE';
  if (scored && !scored.promote && !vertical?.ageRestricted) {
    status = 'DRAFT';
  }

  const existing = await findProductBySourceId(
    client,
    product.platform,
    product.externalId,
  );

  const result = await upsertProduct(
    client,
    {
      id: existing?.id,
      title: product.title,
      descriptionHtml: product.descriptionHtml,
      vendor: product.vendor || env.CATALOG_DEFAULT_VENDOR || 'Lumen Atelier',
      productType: product.productType,
      tags: [
        ...product.tags,
        'dropship',
        `source:${product.platform}`,
        ...(scored?.promote ? ['ai-promote'] : []),
        ...(scored?.matchedTrends.length ? ['trending'] : []),
        ...(vertical?.ageRestricted ? ['age-18-plus'] : []),
      ],
      status,
      metafields: productToMetafields(
        product,
        vertical?.ageRestricted ?? false,
        scored,
      ),
      variants: [
        {
          sku: product.sku,
          price: retailPrice,
          compareAtPrice: product.compareAtPrice,
        },
      ],
      media: product.imageUrls.slice(0, 10).map((url) => ({
        originalSource: url,
        mediaContentType: 'IMAGE' as const,
      })),
    },
    dryRun,
  );

  if (result.action === 'created') report.created++;
  else report.updated++;

  logInfo(`product ${product.externalId}`, {
    platform: product.platform,
    seller: product.sellerId,
    action: result.action,
    composite: scored?.scores.composite,
  });
}

export async function importScoredProducts(options: {
  env: CatalogEnv;
  client: ShopifyAdminClient;
  dryRun: boolean;
  products: ScoredProduct[];
}) {
  const {env, client, dryRun, products} = options;
  const report: SyncReport['products'] = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  if (products.length === 0) {
    logWarn('No scored products to import — widen supplier feeds or lower score threshold');
    return report;
  }

  for (const product of products) {
    try {
      await upsertOneProduct(
        {env, client, dryRun, product, scored: product},
        report,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      report.errors.push(`${product.externalId}: ${message}`);
    }
  }

  return report;
}

export async function importSupplierProducts(options: {
  env: CatalogEnv;
  client: ShopifyAdminClient;
  dryRun: boolean;
  verticalHandles: string[];
  platformIds: SupplierPlatformId[];
}) {
  const {env, client, dryRun, verticalHandles, platformIds} = options;
  const report: SyncReport['products'] = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  const products = await fetchAllSupplierProducts({
    env,
    platformIds,
    verticalHandles,
  });

  if (products.length === 0) {
    logWarn('No supplier products fetched — configure CSV or API adapters');
    return report;
  }

  for (const product of products) {
    try {
      await upsertOneProduct({env, client, dryRun, product}, report);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      report.errors.push(`${product.externalId}: ${message}`);
    }
  }

  return report;
}
