import {Suspense} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {LocaleSwitcher} from '~/components/LocaleSwitcher';
import {useBrand} from '~/hooks/useBrand';
import {stripLocalePrefix} from '~/lib/i18n/paths';
import {useI18n} from '~/lib/i18n/I18nProvider';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

function resolveMenuPath(
  itemUrl: string,
  primaryDomainUrl: string,
  publicStoreDomain: string,
  path: (internalPath: string) => string,
) {
  const isInternal =
    itemUrl.includes('myshopify.com') ||
    itemUrl.includes(publicStoreDomain) ||
    itemUrl.includes(primaryDomainUrl);

  if (!isInternal) return itemUrl;

  const pathname = new URL(itemUrl).pathname;
  return path(stripLocalePrefix(pathname));
}

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const {t, path} = useI18n();
  const brand = useBrand();
  const {menu} = header;
  return (
    <header className="header">
      <NavLink prefetch="intent" to={path('/')} style={activeLinkStyle} end>
        <span className="header-brand">
          <strong className="font-display">{brand.name}</strong>
          <span className="header-tagline">{t('brand.tagline')}</span>
        </span>
      </NavLink>
      <HeaderMenu
        menu={menu}
        viewport="desktop"
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
      />
      <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
    </header>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const {t, path} = useI18n();
  const className = `header-menu-${viewport}`;
  const {close} = useAside();

  return (
    <nav className={className} role="navigation">
      {viewport === 'mobile' && (
        <NavLink
          end
          onClick={close}
          prefetch="intent"
          style={activeLinkStyle}
          to={path('/')}
        >
          {t('nav.home')}
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        const url = resolveMenuPath(
          item.url,
          primaryDomainUrl,
          publicStoreDomain,
          path,
        );
        return (
          <NavLink
            className="header-menu-item"
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            style={activeLinkStyle}
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  const {t, path} = useI18n();

  return (
    <nav className="header-ctas" role="navigation">
      <LocaleSwitcher className="locale-switcher header-locale" />
      <HeaderMenuMobileToggle />
      <NavLink prefetch="intent" to={path('/account')} style={activeLinkStyle}>
        <Suspense fallback={t('nav.signIn')}>
          <Await resolve={isLoggedIn} errorElement={t('nav.signIn')}>
            {(loggedIn) => (loggedIn ? t('nav.account') : t('nav.signIn'))}
          </Await>
        </Suspense>
      </NavLink>
      <SearchToggle />
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      className="header-menu-mobile-toggle reset"
      onClick={() => open('mobile')}
    >
      <h3>☰</h3>
    </button>
  );
}

function SearchToggle() {
  const {t} = useI18n();
  const {open} = useAside();
  return (
    <button className="reset" onClick={() => open('search')}>
      {t('nav.search')}
    </button>
  );
}

function CartBadge({count}: {count: number}) {
  const {t, path} = useI18n();
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href={path('/cart')}
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
    >
      {t('nav.cart')}{' '}
      <span aria-label={`(${t('nav.items', {count})})`}>{count}</span>
    </a>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};

function activeLinkStyle({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return {
    fontWeight: isActive ? 600 : undefined,
    color: isPending ? 'var(--color-ink-muted)' : 'var(--color-ink)',
    textDecoration: isActive ? 'underline' : undefined,
    textUnderlineOffset: '6px',
  };
}
