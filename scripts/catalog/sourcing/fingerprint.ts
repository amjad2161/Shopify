import type {ProductFingerprint, SupplierProduct} from '../types.ts';

/** Normalize title for cross-platform deduplication. */
export function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function productFingerprint(product: SupplierProduct): ProductFingerprint {
  const skuKey = product.sku?.trim().toLowerCase();
  if (skuKey && skuKey.length >= 4) {
    return `sku:${skuKey}`;
  }
  const titleKey = normalizeTitle(product.title).slice(0, 120);
  const category = product.categoryHandles[0] ?? 'general';
  return `title:${category}:${titleKey}`;
}
