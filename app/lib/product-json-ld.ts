type ProductJsonLdInput = {
  title: string;
  description?: string | null;
  handle: string;
  vendor?: string | null;
  seo?: {description?: string | null; title?: string | null} | null;
  selectedOrFirstAvailableVariant?: {
    sku?: string | null;
    availableForSale?: boolean;
    image?: {url?: string | null} | null;
    price?: {amount: string; currencyCode: string} | null;
  } | null;
};

/** JSON-LD Product schema for PDP SEO. */
export function productJsonLd(
  product: ProductJsonLdInput,
  productUrl: string,
  brandName: string,
) {
  const variant = product.selectedOrFirstAvailableVariant;
  const price = variant?.price;
  const description =
    product.seo?.description?.trim() || product.description?.trim() || undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    ...(description ? {description} : {}),
    url: productUrl,
    ...(variant?.image?.url ? {image: variant.image.url} : {}),
    ...(variant?.sku ? {sku: variant.sku} : {}),
    brand: {
      '@type': 'Brand',
      name: product.vendor?.trim() || brandName,
    },
    ...(price
      ? {
          offers: {
            '@type': 'Offer',
            url: productUrl,
            priceCurrency: price.currencyCode,
            price: price.amount,
            availability: variant?.availableForSale
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
        }
      : {}),
  };
}
