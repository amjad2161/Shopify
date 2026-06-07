import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/($locale)._index';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import {NewsletterStrip} from '~/components/NewsletterStrip';
import {ImmersiveHome} from '~/components/experience/ImmersiveHome';
import {BRAND, organizationJsonLd, resolveBrandUrl} from '~/lib/brand';
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
    <div className="home">
      <Hero featuredCollection={data.featuredCollection} />
      <FeaturedCollection collection={data.featuredCollection} />
      <RecommendedProducts products={data.recommendedProducts} />
      <NewsletterStrip />
      <EditorialStrip />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd(data.brandUrl)),
        }}
      />
    </div>
  );
}

function Hero({
  featuredCollection,
}: {
  featuredCollection: FeaturedCollectionFragment | null;
}) {
  const {t, path} = useI18n();
  const collectionHandle = featuredCollection?.handle ?? 'all';

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-copy">
        <p className="hero-eyebrow">{t('home.hero.eyebrow')}</p>
        <h1 id="hero-heading" className="hero-title font-display">
          {BRAND.name}
        </h1>
        <p className="hero-lead">{t('brand.tagline')}</p>
        <p className="hero-body">{t('brand.description')}</p>
        <div className="hero-actions">
          <Link className="hero-cta hero-cta-primary" to={path('/collections/all')}>
            {t('home.hero.shopEdit')}
          </Link>
          {featuredCollection ? (
            <Link
              className="hero-cta hero-cta-secondary"
              to={path(`/collections/${collectionHandle}`)}
            >
              {t('home.hero.featuredCollection')}
            </Link>
          ) : null}
        </div>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="hero-glow" />
        <div className="hero-frame">
          <span className="hero-frame-label">{t('home.hero.est')}</span>
        </div>
      </div>
    </section>
  );
}

function FeaturedCollection({
  collection,
}: {
  collection: FeaturedCollectionFragment | null;
}) {
  const {t, path} = useI18n();

  if (!collection) {
    return (
      <section className="featured-collection-empty" aria-live="polite">
        <p className="featured-collection-eyebrow">
          {t('home.featured.eyebrow')}
        </p>
        <h2 className="font-display">{t('home.featured.emptyTitle')}</h2>
        <p>{t('home.featured.emptyBody')}</p>
        <Link className="featured-collection-link" to={path('/collections/all')}>
          {t('home.featured.browseAll')}
        </Link>
      </section>
    );
  }

  const image = collection.image;
  return (
    <Link
      className="featured-collection"
      to={path(`/collections/${collection.handle}`)}
    >
      {image && (
        <div className="featured-collection-image">
          <Image
            data={image}
            sizes="100vw"
            alt={image.altText || collection.title}
          />
        </div>
      )}
      <div className="featured-collection-overlay">
        <p className="featured-collection-eyebrow">
          {t('home.featured.eyebrow')}
        </p>
        <h2 className="font-display featured-collection-title">
          {collection.title}
        </h2>
        <span className="featured-collection-link">
          {t('home.featured.explore')}
        </span>
      </div>
    </Link>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  const {t} = useI18n();

  return (
    <section
      className="recommended-products"
      aria-labelledby="recommended-products"
    >
      <div className="recommended-products-header">
        <p className="recommended-products-eyebrow">
          {t('home.recommended.eyebrow')}
        </p>
        <h2 id="recommended-products" className="font-display">
          {t('home.recommended.title')}
        </h2>
        <p className="recommended-products-sub">{t('home.recommended.sub')}</p>
      </div>
      <Suspense
        fallback={
          <div className="recommended-products-loading">
            {t('home.recommended.loading')}
          </div>
        }
      >
        <Await resolve={products}>
          {(response) => {
            const nodes = response?.products.nodes ?? [];

            if (!nodes.length) {
              return (
                <p className="recommended-products-empty" role="status">
                  {t('home.recommended.empty')}
                </p>
              );
            }

            return (
              <div className="recommended-products-grid">
                {nodes.map((product, index) => (
                  <ProductItem
                    key={product.id}
                    product={product}
                    loading={index < 4 ? 'eager' : 'lazy'}
                  />
                ))}
              </div>
            );
          }}
        </Await>
      </Suspense>
    </section>
  );
}

function EditorialStrip() {
  const {t} = useI18n();

  return (
    <section className="editorial-strip" aria-label={t('home.editorial.ariaLabel')}>
      <div className="editorial-strip-inner">
        <article>
          <h3 className="font-display">{t('home.editorial.materialTitle')}</h3>
          <p>{t('home.editorial.materialBody')}</p>
        </article>
        <article>
          <h3 className="font-display">{t('home.editorial.shipTitle')}</h3>
          <p>{t('home.editorial.shipBody')}</p>
        </article>
        <article>
          <h3 className="font-display">
            {t('home.editorial.confidenceTitle')}
          </h3>
          <p>{t('home.editorial.confidenceBody')}</p>
        </article>
      </div>
    </section>
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
