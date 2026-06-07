import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import {NewsletterStrip} from '~/components/NewsletterStrip';
import {BRAND, organizationJsonLd, pageTitle, resolveBrandUrl} from '~/lib/brand';
import type {StoreEnvRecord} from '~/lib/store-env';

const DEFAULT_FEATURED_COLLECTION_HANDLE = 'frontpage';

function getFeaturedCollectionHandle(env: Env) {
  const record = env as unknown as StoreEnvRecord;
  return record.FEATURED_COLLECTION_HANDLE?.trim();
}

export const meta: Route.MetaFunction = ({data}) => {
  const title = pageTitle();
  const image = data?.featuredCollection?.image?.url;
  const brandUrl = data?.brandUrl;

  const tags = [
    {title},
    {name: 'description', content: BRAND.description},
    {property: 'og:title', content: title},
    {property: 'og:description', content: BRAND.description},
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
  const collectionHandle = featuredCollection?.handle ?? 'all';

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-copy">
        <p className="hero-eyebrow">New season</p>
        <h1 id="hero-heading" className="hero-title font-display">
          {BRAND.name}
        </h1>
        <p className="hero-lead">{BRAND.tagline}</p>
        <p className="hero-body">{BRAND.description}</p>
        <div className="hero-actions">
          <Link className="hero-cta hero-cta-primary" to="/collections/all">
            Shop the edit
          </Link>
          {featuredCollection ? (
            <Link
              className="hero-cta hero-cta-secondary"
              to={`/collections/${collectionHandle}`}
            >
              Featured collection
            </Link>
          ) : null}
        </div>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="hero-glow" />
        <div className="hero-frame">
          <span className="hero-frame-label">Est. MMXXVI</span>
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
  if (!collection) {
    return (
      <section className="featured-collection-empty" aria-live="polite">
        <p className="featured-collection-eyebrow">Curated collection</p>
        <h2 className="font-display">Collections are on the way</h2>
        <p>
          Publish a collection in Shopify admin — set{' '}
          <code>FEATURED_COLLECTION_HANDLE</code> in <code>.env</code> to pin the
          homepage feature.
        </p>
        <Link className="featured-collection-link" to="/collections/all">
          Browse all products →
        </Link>
      </section>
    );
  }

  const image = collection.image;
  return (
    <Link
      className="featured-collection"
      to={`/collections/${collection.handle}`}
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
        <p className="featured-collection-eyebrow">Curated collection</p>
        <h2 className="font-display featured-collection-title">
          {collection.title}
        </h2>
        <span className="featured-collection-link">Explore →</span>
      </div>
    </Link>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <section
      className="recommended-products"
      aria-labelledby="recommended-products"
    >
      <div className="recommended-products-header">
        <p className="recommended-products-eyebrow">The atelier edit</p>
        <h2 id="recommended-products" className="font-display">
          Pieces we return to
        </h2>
        <p className="recommended-products-sub">
          A tight selection of objects with enduring form — made to layer, live
          in, and last.
        </p>
      </div>
      <Suspense fallback={<div className="recommended-products-loading">Curating…</div>}>
        <Await resolve={products}>
          {(response) => {
            const nodes = response?.products.nodes ?? [];

            if (!nodes.length) {
              return (
                <p className="recommended-products-empty" role="status">
                  Products will appear here once your catalog is published in
                  Shopify admin.
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
  return (
    <section className="editorial-strip" aria-label="Brand values">
      <div className="editorial-strip-inner">
        <article>
          <h3 className="font-display">Material first</h3>
          <p>Natural fibers, honest finishes, and suppliers we know by name.</p>
        </article>
        <article>
          <h3 className="font-display">Shipped with care</h3>
          <p>Thoughtful packaging and tracked delivery when your store offers it.</p>
        </article>
        <article>
          <h3 className="font-display">Shop with confidence</h3>
          <p>Return and shipping policies follow your live Shopify checkout settings.</p>
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
