import {redirect, useLoaderData, type MetaDescriptor} from 'react-router';
import type {Route} from './+types/($locale).collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductItem} from '~/components/ProductItem';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {collectionRequiresAgeGate} from '~/lib/age-gate';
import {redirectToAgeVerifyIfNeeded} from '~/lib/age-gate-redirect';
import {resolveBrand, resolveBrandUrl} from '~/lib/brand';
import {
  breadcrumbJsonLd,
  buildCanonicalUrl,
  canonicalLinkMeta,
  collectionJsonLd,
  hreflangAlternateMetas,
} from '~/lib/seo-meta';

import {
  findLocaleByPath,
  getDefaultLocale,
  localizePath,
  brandNameFromMatches,
  localizedPageTitle,
  translate,
  useI18n,
} from '~/lib/i18n';

export const meta: Route.MetaFunction = ({data, params, matches, location}) => {
  const brandName = brandNameFromMatches(matches);
  const locale = findLocaleByPath(params.locale) ?? getDefaultLocale();
  const page =
    data?.collection.title ??
    translate(locale.uiLocale, 'meta.collection');
  const title = localizedPageTitle(page, locale.uiLocale, brandName);
  const handle = data?.collection?.handle ?? params.handle;
  const pathname = handle ? `/collections/${handle}` : location.pathname;
  const canonicalUrl = buildCanonicalUrl({
    brandUrl: data?.brandUrl,
    localePath: locale.path,
    pathname,
  });

  const tags: MetaDescriptor[] = [
    {title},
    canonicalLinkMeta(canonicalUrl),
    ...hreflangAlternateMetas(data?.brandUrl, location.pathname),
  ];

  if (data?.collection?.description) {
    tags.push({
      name: 'description',
      content: data.collection.description.slice(0, 160),
    });
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
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    throw redirect(localizePath('/collections', params.locale));
  }

  if (collectionRequiresAgeGate(handle)) {
    redirectToAgeVerifyIfNeeded({
      session: context.session,
      localePath: locale.path,
      returnPath: `/collections/${handle}`,
    });
  }

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables},
      // Add other queries here, so that they are loaded in parallel
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {
    collection,
    brand: resolveBrand(context.env),
    brandUrl: resolveBrandUrl(context.env),
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Collection() {
  const {collection, brandUrl} = useLoaderData<typeof loader>();
  const {t, path} = useI18n();
  const collectionPath = path(`/collections/${collection.handle}`);
  const collectionUrl = brandUrl
    ? `${brandUrl}${collectionPath}`
    : collectionPath;

  return (
    <div className="collection">
      <h1>{collection.title}</h1>
      <p className="collection-description">{collection.description}</p>
      <PaginatedResourceSection<ProductItemFragment>
        connection={collection.products}
        resourcesClassName="products-grid"
      >
        {({node: product, index}) => (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        )}
      </PaginatedResourceSection>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            collectionJsonLd(collection, collectionUrl),
            breadcrumbJsonLd([
              {name: t('nav.home'), url: brandUrl ? `${brandUrl}${path('/')}` : path('/')},
              {name: collection.title, url: collectionUrl},
            ]),
          ]),
        }}
      />
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
