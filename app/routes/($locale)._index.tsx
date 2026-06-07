import {Await, useLoaderData} from 'react-router';
import type {Route} from './+types/($locale)._index';
import {Suspense} from 'react';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {ClassicHomepage} from '~/components/home/ClassicHomepage';
import {ImmersiveHome} from '~/components/experience/ImmersiveHome';
import {organizationJsonLd, resolveBrandUrl} from '~/lib/brand';
import {isImmersive3dEnabled} from '~/lib/experience';
import type {StoreEnvRecord} from '~/lib/store-env';
import {
  findLocaleByPath,
  getDefaultLocale,
  localizedPageTitle,
  translate,
  useI18n,
} from '~/lib/i18n';

const DEFAULT_FEATURED_COLLECTION_HANDLE = 'frontpage';

function getFeaturedCollectionHandle(env: Env) {
  const record = env as unknown as StoreEnvRecord;
  const multi = record.FEATURED_COLLECTION_HANDLES?.trim();
  if (multi) {
    const first = multi.split(',')[0]?.trim();
    if (first) return first;
  }
  return record.FEATURED_COLLECTION_HANDLE?.trim();
}

export const meta: Route.MetaFunction = ({data, params}) => {
  const locale = findLocaleByPath(params.locale) ?? getDefaultLocale();
  const title = localizedPageTitle(undefined, locale.uiLocale);
  const description = translate(locale.uiLocale, 'brand.description');
  const image = data?.featuredCollection?.image?.url;
  const brandUrl = data?.brandUrl;

  const tags = [
    {title},
    {name: 'description', content: description},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:type', content: 'website'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];

  if (brandUrl) {
    tags.push({property: 'og:url', content: brandUrl});
  }

  if (image) {
    tags.push({property: 'og:image', content: image});
    tags.push({name: 'twitter:image', content: image});
  }

  return tags;
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return {
    ...deferredData,
    ...criticalData,
    brandUrl: resolveBrandUrl(args.context.env),
    immersive3d: isImmersive3dEnabled(
      args.context.env as unknown as StoreEnvRecord,
    ),
  };
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  const featuredHandle =
    getFeaturedCollectionHandle(context.env) ||
    DEFAULT_FEATURED_COLLECTION_HANDLE;

  const collectionByHandle = await context.storefront
    .query(FEATURED_COLLECTION_BY_HANDLE_QUERY, {
      variables: {handle: featuredHandle},
    })
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  let featuredCollection = collectionByHandle?.collection ?? null;

  if (!featuredCollection) {
    const fallback = await context.storefront
      .query(FEATURED_COLLECTION_FALLBACK_QUERY)
      .catch((error: Error) => {
        console.error(error);
        return null;
      });

    featuredCollection = fallback?.collections?.nodes?.[0] ?? null;
  }

  return {
    featuredCollection,
  };
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();

  if (data.immersive3d) {
    return (
      <>
        <Suspense
          fallback={
            <div className="experience-shell">
              <div className="experience-canvas-fallback" />
            </div>
          }
        >
          <Await resolve={data.recommendedProducts}>
            {(response) => (
              <ImmersiveHome
                products={response?.products.nodes ?? []}
                collectionHandle={data.featuredCollection?.handle}
                featuredCollection={data.featuredCollection}
                recommendedProducts={data.recommendedProducts}
              />
            )}
          </Await>
        </Suspense>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd(data.brandUrl)),
          }}
        />
      </>
    );
  }

  return (
    <>
      <ClassicHomepage
        featuredCollection={data.featuredCollection}
        recommendedProducts={data.recommendedProducts}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd(data.brandUrl)),
        }}
      />
    </>
  );
}

const FEATURED_COLLECTION_FRAGMENT = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
` as const;

const FEATURED_COLLECTION_BY_HANDLE_QUERY = `#graphql
  query FeaturedCollectionByHandle(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      ...FeaturedCollection
    }
  }
  ${FEATURED_COLLECTION_FRAGMENT}
` as const;

const FEATURED_COLLECTION_FALLBACK_QUERY = `#graphql
  query FeaturedCollectionFallback($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
  ${FEATURED_COLLECTION_FRAGMENT}
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    totalInventory
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
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
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 8, sortKey: BEST_SELLING) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
