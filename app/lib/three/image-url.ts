/**
 * Request a Shopify CDN image with width + WebP format for lighter GPU textures.
 */
export function optimizeShopifyImageUrl(
  url: string | undefined | null,
  width = 512,
): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('cdn.shopify.com')) {
      return url;
    }
    parsed.searchParams.set('width', String(width));
    parsed.searchParams.set('format', 'webp');
    return parsed.toString();
  } catch {
    return url;
  }
}
