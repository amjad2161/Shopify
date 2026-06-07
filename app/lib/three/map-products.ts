export type SceneProduct = {
  id: string;
  handle: string;
  title: string;
  imageUrl?: string;
  priceLabel?: string;
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

export function mapProductsToScene<T extends {
  id: string;
  handle: string;
  title: string;
  featuredImage?: {url?: string | null} | null;
  priceRange?: {minVariantPrice?: {amount?: string; currencyCode?: string}};
}>(products: T[]): SceneProduct[] {
  return products.slice(0, 8).map((product, index) => {
    const amount = product.priceRange?.minVariantPrice?.amount;
    const currency = product.priceRange?.minVariantPrice?.currencyCode ?? '';
    const priceLabel =
      amount != null ? `${currency} ${Number(amount).toFixed(0)}`.trim() : undefined;

    return {
      id: product.id,
      handle: product.handle,
      title: product.title,
      imageUrl: product.featuredImage?.url ?? undefined,
      priceLabel,
      position: orbitPosition(index, products.length),
      hue: HUES[index % HUES.length] ?? 0.5,
    };
  });
}
