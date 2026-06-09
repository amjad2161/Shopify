import {Await, Link, useLocation, useRouteLoaderData} from 'react-router';
import {Suspense, useId} from 'react';
import type {RootLoader} from '~/root';
import {isImmersiveHomePath} from '~/lib/experience';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Aside} from '~/components/Aside';
import {SkipLink} from '~/components/SkipLink';
import {AnnouncementBar} from '~/components/AnnouncementBar';
import {Footer} from '~/components/Footer';
import {Header, HeaderMenu} from '~/components/Header';
import {CartMain} from '~/components/CartMain';
import {SearchFormPredictive} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';
import {useI18n} from '~/lib/i18n/I18nProvider';
import {useAnnouncementOffset} from '~/hooks/useAnnouncementOffset';
import {usePageTransition} from '~/hooks/usePageTransition';
import {useWebVitals} from '~/hooks/useWebVitals';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

export function PageLayout({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
  publicStoreDomain,
}: PageLayoutProps) {
  const location = useLocation();
  const root = useRouteLoaderData<RootLoader>('root');
  const immersive3dEnabled = Boolean(root?.immersive3dEnabled);
  const immersiveHome =
    immersive3dEnabled && isImmersiveHomePath(location.pathname);

  useAnnouncementOffset(immersiveHome);
  usePageTransition(immersive3dEnabled);
  useWebVitals(immersive3dEnabled, immersiveHome ? '3d' : 'classic');

  return (
    <Aside.Provider>
      <div className={immersiveHome ? 'layout--immersive' : undefined}>
        <SkipLink />
        <CartAside cart={cart} />
        <SearchAside />
        <MobileMenuAside header={header} publicStoreDomain={publicStoreDomain} />
        <AnnouncementBar />
        {header && (
          <Header
            header={header}
            cart={cart}
            isLoggedIn={isLoggedIn}
            publicStoreDomain={publicStoreDomain}
          />
        )}
        <main
          id="main-content"
          className={immersiveHome ? 'main--immersive' : undefined}
        >
          {children}
        </main>
        {!immersiveHome ? (
          <Footer
            footer={footer}
            header={header}
            publicStoreDomain={publicStoreDomain}
          />
        ) : null}
      </div>
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  const {t} = useI18n();

  return (
    <Aside type="cart" heading={t('cart.heading')}>
      <Suspense fallback={<p>{t('cart.loading')}</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

function SearchAside() {
  const {t, path} = useI18n();
  const queriesDatalistId = useId();

  return (
    <Aside type="search" heading={t('search.heading')}>
      <div className="predictive-search">
        <br />
        <SearchFormPredictive>
          {({fetchResults, goToSearch, inputRef}) => (
            <>
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder={t('search.placeholder')}
                ref={inputRef}
                type="search"
                list={queriesDatalistId}
              />
              &nbsp;
              <button onClick={goToSearch}>{t('search.placeholder')}</button>
            </>
          )}
        </SearchFormPredictive>

        <SearchResultsPredictive>
          {({items, total, term, state, closeSearch}) => {
            const {articles, collections, pages, products, queries} = items;

            if (state === 'loading' && term.current) {
              return <div>{t('search.loading')}</div>;
            }

            if (!total) {
              return <SearchResultsPredictive.Empty term={term} />;
            }

            return (
              <>
                <SearchResultsPredictive.Queries
                  queries={queries}
                  queriesDatalistId={queriesDatalistId}
                />
                <SearchResultsPredictive.Products
                  products={products}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Collections
                  collections={collections}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Pages
                  pages={pages}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Articles
                  articles={articles}
                  closeSearch={closeSearch}
                  term={term}
                />
                {term.current && total ? (
                  <Link
                    onClick={closeSearch}
                    to={`${path('/search')}?q=${term.current}`}
                  >
                    <p>
                      {t('search.viewAll')}{' '}
                      <q>{term.current}</q>
                      &nbsp; →
                    </p>
                  </Link>
                ) : null}
              </>
            );
          }}
        </SearchResultsPredictive>
      </div>
    </Aside>
  );
}

function MobileMenuAside({
  header,
  publicStoreDomain,
}: {
  header: PageLayoutProps['header'];
  publicStoreDomain: PageLayoutProps['publicStoreDomain'];
}) {
  const {t} = useI18n();

  return (
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading={t('nav.menu')}>
        <HeaderMenu
          menu={header.menu}
          viewport="mobile"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
      </Aside>
    )
  );
}
