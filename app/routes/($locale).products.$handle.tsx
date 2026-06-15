import {useLoaderData, useRouteLoaderData, type MetaDescriptor} from 'react-router';
import type {Route} from './+types/($locale).products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductViewer3d} from '~/components/product/ProductViewer3d';
import {ProductForm} from '~/components/ProductForm';
import {
  isLowStock,
  resolveProductModelUrl,
} from '~/lib/three/map-products';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {
  productRequiresAgeGate,
} from '~/lib/age-gate';
import {redirectToAgeVerifyIfNeeded} from '~/lib/age-gate-redirect';
import {resolveBrand, resolveBrandUrl} from '~/lib/brand';
import {productJsonLd} from '~/lib/product-json-ld';
import {sanitizeProductHtml} from '~/lib/sanitize-html';
import {
  findLocaleByPath,
  getDefaultLocale,
  localizePath,
  brandNameFromMatches,
  localizedPageTitle,
  translate,
  useI18n,
} from '~/lib/i18n';
import type {RootLoader} from '~/root';

export const meta: Route.MetaFunction = ({data, params, matches}) => {
  const locale = findLocaleByPath(params.locale) ?? getDefaultLocale();
  const product = data?.product;
  const page = product?.title ?? translate(locale.uiLocale, 'meta.product');
  const handle = product?.handle;
  const brandName = data?.brand?.name ?? brandNameFromMatches(matches);
  const title = localizedPageTitle(page, locale.uiLocale, brandName);
  const description =
    product?.seo?.description?.trim() ||
    product?.description?.trim() ||
    translate(locale.uiLocale, 'brand.description');
  const image = product?.selectedOrFirstAvailableVariant?.image?.url;
  const productPath = handle
    ? localizePath(`/products/${handle}`, locale.path)
    : undefined;
  const canonicalUrl =
    data?.brandUrl && productPath
      ? `${data.brandUrl}${productPath}`
      : productPath;

  const tags: MetaDescriptor[] = [
    {title},
    {name: 'description', content: description},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:type', content: 'product'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
  ];

  if (canonicalUrl) {
    tags.push({property: 'og:url', content: canonicalUrl});
    tags.push({tagName: 'link', rel: 'canonical', href: canonicalUrl});
  }

  if (image) {
    tags.push({property: 'og:image', content: image});
    tags.push({name: 'twitter:image', content: image});
  }

  return tags;
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  const locale = findLocaleByPath(params.locale) ?? getDefaultLocale();

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  if (productRequiresAgeGate(product.tags)) {
    redirectToAgeVerifyIfNeeded({
      session: context.session,
      localePath: locale.path,
      returnPath: `/products/${handle}`,
    });
  }

  return {
    product,
    brand: resolveBrand(context.env),
    brandUrl: resolveBrandUrl(context.env),
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context, params}: Route.LoaderArgs) {
  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

export default function Product() {
  const {product, brand, brandUrl} = useLoaderData<typeof loader>();
  const root = useRouteLoaderData<RootLoader>('root');
  const {t, path} = useI18n();

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml, totalInventory, handle} = product;
  const modelUrl = resolveProductModelUrl(product);
  const safeDescriptionHtml = sanitizeProductHtml(descriptionHtml);
  const brandName = brand?.name ?? root?.brand?.name ?? 'OneClick Hub';
  const siteUrl = brandUrl ?? root?.brandUrl;
  const productUrl =
    siteUrl && handle
      ? `${siteUrl}${path(`/products/${handle}`)}`
      : path(`/products/${handle}`);

  return (
    <div className="product">
      <ProductViewer3d
        modelUrl={modelUrl}
        image={selectedVariant?.image}
        title={title}
        handle={handle}
      />
      <div className="product-main">
        <h1>{title}</h1>
        {isLowStock(totalInventory) ? (
          <p className="product-low-stock" role="status">
            {t('product.lowStock', {count: totalInventory ?? 0})}
          </p>
        ) : null}
        <ProductPrice
          price={selectedVariant?.price}
          compareAtPrice={selectedVariant?.compareAtPrice}
        />
        <br />
        <ProductForm
          productOptions={productOptions}
          selectedVariant={selectedVariant}
        />
        <br />
        <br />
        <p>
          <strong>{t('product.description')}</strong>
        </p>
        <br />
        <div dangerouslySetInnerHTML={{__html: safeDescriptionHtml}} />
        <br />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            productJsonLd(product, productUrl, brandName),
          ),
        }}
      />
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    tags
    totalInventory
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    media(first: 5) {
      nodes {
        __typename
        ... on Model3d {
          sources {
            url
            format
            mimeType
          }
        }
      }
    }
    model3dMetafield: metafield(namespace: "custom", key: "model_3d") {
      reference {
        ... on GenericFile {
          url
        }
      }
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
