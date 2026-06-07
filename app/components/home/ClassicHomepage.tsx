import {Await, Link} from 'react-router';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import {NewsletterStrip} from '~/components/NewsletterStrip';
import {BRAND} from '~/lib/brand';
import {useI18n} from '~/lib/i18n/I18nProvider';

type ClassicHomepageProps = {
  featuredCollection: FeaturedCollectionFragment | null;
  recommendedProducts: Promise<RecommendedProductsQuery | null>;
};

/** Classic 2D homepage — used as fallback when WebGL is unavailable. */
export function ClassicHomepage({
  featuredCollection,
  recommendedProducts,
}: ClassicHomepageProps) {
  return (
    <div className="home">
      <Hero featuredCollection={featuredCollection} />
      <FeaturedCollection collection={featuredCollection} />
      <RecommendedProducts products={recommendedProducts} />
      <NewsletterStrip />
      <EditorialStrip />
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
