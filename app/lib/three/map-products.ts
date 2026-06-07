import {optimizeShopifyImageUrl} from '~/lib/three/image-url';
import {pickModel3dSource} from '~/lib/three/load-glb';

export type SceneProduct = {
  id: string;
  handle: string;
  title: string;
  imageUrl?: string;
  modelUrl?: string;
  priceLabel?: string;
  totalInventory?: number | null;
  /** Orbit position in world space */
  position: [number, number, number];
  /** Pixar-style accent hue 0–1 */
  hue: number;
};

const HUES = [0.08, 0.12, 0.55, 0.72, 0.92, 0.35, 0.48, 0.62];

function orbitPosition(index: number, total: number): [number, number, number] {
  const radius = 2.4 + (index % 3) * 0.35;
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  const y = Math.sin(angle * 2) * 0.45;
  return [Math.cos(angle) * radius, y, Math.sin(angle) * radius - 1.2];
}

type ModelMediaNode = {
  __typename?: string;
  sources?: Array<{
    url?: string | null;
    format?: string | null;
    mimeType?: string | null;
  }> | null;
};

type MappableProduct = {
  id: string;
  handle: string;
  title: string;
  featuredImage?: {url?: string | null} | null;
  priceRange?: {minVariantPrice?: {amount?: string; currencyCode?: string}};
  totalInventory?: number | null;
  media?: {nodes?: Array<ModelMediaNode | null> | null} | null;
  model3dMetafield?: {
    reference?: {url?: string | null} | null;
  } | null;
};

/** Ethical low-stock badge: only when Shopify reports 1–5 units left. */
export function isLowStock(totalInventory: number | null | undefined): boolean {
  if (totalInventory == null) return false;
  return totalInventory >= 1 && totalInventory <= 5;
}

/** Resolve a GLB/GLTF URL from product media or custom metafield. */
export function resolveProductModelUrl(
  product: MappableProduct,
): string | undefined {
  for (const node of product.media?.nodes ?? []) {
    const picked = pickModel3dSource(node?.sources ?? undefined);
    if (picked?.url) return picked.url;
  }

  const metafieldUrl = product.model3dMetafield?.reference?.url;
  if (metafieldUrl) return metafieldUrl;

  return undefined;
}

export function mapProductsToScene<T extends MappableProduct>(
  products: T[],
): SceneProduct[] {
  return products.slice(0, 8).map((product, index) => {
    const amount = product.priceRange?.minVariantPrice?.amount;
    const currency = product.priceRange?.minVariantPrice?.currencyCode ?? '';
    const priceLabel =
      amount != null ? `${currency} ${Number(amount).toFixed(0)}`.trim() : undefined;

    return {
      id: product.id,
      handle: product.handle,
      title: product.title,
      imageUrl: optimizeShopifyImageUrl(product.featuredImage?.url, 512),
      modelUrl: resolveProductModelUrl(product),
      priceLabel,
      totalInventory: product.totalInventory ?? null,
      position: orbitPosition(index, products.length),
      hue: HUES[index % HUES.length] ?? 0.5,
    };
  });
}

/** Products that should preload GLB assets (first visible set). */
export function sceneProductsWithModels(products: SceneProduct[]): SceneProduct[] {
  return products.filter((p) => Boolean(p.modelUrl));
}
