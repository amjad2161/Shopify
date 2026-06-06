import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import {MockShopNotice} from '~/components/MockShopNotice';
import {NewsletterStrip} from '~/components/NewsletterStrip';
import {BRAND, organizationJsonLd, pageTitle} from '~/lib/brand';

export const meta: Route.MetaFunction = () => {
  const title = pageTitle();
  return [
    {title},
    {name: 'description', content: BRAND.description},
    {property: 'og:title', content: title},
    {property: 'og:description', content: BRAND.description},
    {property: 'og:type', content: 'website'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
  ]);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredCollection: collections.nodes[0],
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
      {data.isShopLinked ? null : <MockShopNotice />}
      <Hero featuredCollection={data.featuredCollection} />
      <FeaturedCollection collection={data.featuredCollection} />
      <RecommendedProducts products={data.recommendedProducts} />
      <NewsletterStrip />
      <EditorialStrip />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd()),
        }}
      />
    </div>
  );
}

function Hero({
  featuredCollection,
}: {
  featuredCollection: FeaturedCollectionFragment;
}) {
  const collectionHandle = featuredCollection?.handle ?? 'frontpage';

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
          <Link
            className="hero-cta hero-cta-secondary"
            to={`/collections/${collectionHandle}`}
          >
            Featured collection
          </Link>
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
  collection: FeaturedCollectionFragment;
}) {
  if (!collection) return null;
  const image = collection?.image;
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
          {(response) => (
            <div className="recommended-products-grid">
              {response
                ? response.products.nodes.map((product, index) => (
                    <ProductItem
                      key={product.id}
                      product={product}
                      loading={index < 4 ? 'eager' : 'lazy'}
                    />
                  ))
                : null}
            </div>
          )}
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
          <p>Plastic-free packaging and tracked delivery on every order.</p>
        </article>
        <article>
          <h3 className="font-display">Easy returns</h3>
          <p>30-day returns on unworn pieces — because fit should feel right.</p>
        </article>
      </div>
    </section>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
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
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
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
    products(first: 8, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
