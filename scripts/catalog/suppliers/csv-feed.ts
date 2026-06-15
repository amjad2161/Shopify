import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import type {CatalogEnv, SupplierAdapter, SupplierProduct} from '../types.ts';

type CsvRow = Record<string, string>;

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: CsvRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

function rowToProduct(row: CsvRow): SupplierProduct | null {
  const externalId = row.external_id || row.id || row.sku;
  const title = row.title || row.name;
  const sku = row.sku || externalId;
  const price = row.price || row.retail_price;
  const sellerId = row.seller_id || row.vendor_id || 'default-seller';

  if (!externalId || !title || !sku || !price) return null;

  const categoryHandles = (row.category_handles || row.categories || '')
    .split('|')
    .map((h) => h.trim())
    .filter(Boolean);

  const imageUrls = (row.image_urls || row.images || row.image_url || '')
    .split('|')
    .map((u) => u.trim())
    .filter(Boolean);

  return {
    externalId,
    platform: 'csv_feed',
    sellerId,
    sellerName: row.seller_name || row.vendor,
    title,
    descriptionHtml: row.description_html || row.description,
    vendor: row.vendor,
    productType: row.product_type || row.type,
    tags: (row.tags || '').split('|').map((t) => t.trim()).filter(Boolean),
    categoryHandles,
    sku,
    price,
    compareAtPrice: row.compare_at_price || row.msrp,
    currency: row.currency || 'USD',
    inventoryQuantity: Number(row.inventory || row.quantity || '100') || 0,
    imageUrls,
    sourceUrl: row.source_url || row.url,
    cost: row.cost || row.supplier_price,
    leadTimeDays: row.lead_time_days
      ? Number(row.lead_time_days)
      : undefined,
  };
}

export const csvFeedAdapter: SupplierAdapter = {
  id: 'csv_feed',
  label: 'CSV product feed',
  isConfigured(env) {
    const path = env.CATALOG_SUPPLIER_CSV_PATH?.trim();
    if (!path) return false;
    return existsSync(resolve(path));
  },
  async fetchProducts({env, verticalHandles, limit = 500}) {
    const path = env.CATALOG_SUPPLIER_CSV_PATH?.trim();
    if (!path) return [];

    const absolute = resolve(path);
    if (!existsSync(absolute)) return [];

    const content = readFileSync(absolute, 'utf8');
    const rows = parseCsv(content);
    const products: SupplierProduct[] = [];

    for (const row of rows) {
      const product = rowToProduct(row);
      if (!product) continue;

      if (verticalHandles.length > 0) {
        const matches = product.categoryHandles.some((h) =>
          verticalHandles.includes(h),
        );
        if (!matches) continue;
      }

      products.push(product);
      if (products.length >= limit) break;
    }

    return products;
  },
};
