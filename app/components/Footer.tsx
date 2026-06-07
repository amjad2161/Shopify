import {Suspense} from 'react';
import {Await, NavLink} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {BRAND} from '~/lib/brand';
import {stripLocalePrefix} from '~/lib/i18n/paths';
import {useI18n} from '~/lib/i18n/I18nProvider';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function Footer({
  footer: footerPromise,
  header,
  publicStoreDomain,
}: FooterProps) {
  const {t, path} = useI18n();

  return (
    <Suspense>
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer className="footer">
            <div className="footer-brand">
              <p className="font-display footer-brand-name">{BRAND.name}</p>
              <p className="footer-brand-tagline">{t('brand.tagline')}</p>
            </div>
            {footer?.menu && header.shop.primaryDomain?.url && (
              <FooterMenu
                menu={footer.menu}
                primaryDomainUrl={header.shop.primaryDomain.url}
                publicStoreDomain={publicStoreDomain}
                path={path}
              />
            )}
            <p className="footer-note">
              {t('footer.note', {
                year: new Date().getFullYear(),
                brand: BRAND.name,
              })}
            </p>
          </footer>
        )}
      </Await>
    </Suspense>
  );
}

function FooterMenu({
  menu,
  primaryDomainUrl,
  publicStoreDomain,
  path,
}: {
  menu: FooterQuery['menu'];
  primaryDomainUrl: FooterProps['header']['shop']['primaryDomain']['url'];
  publicStoreDomain: string;
  path: (internalPath: string) => string;
}) {
  return (
    <nav className="footer-menu" role="navigation">
      {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
        if (!item.url) return null;
        const isInternal =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl);
        const url = isInternal
          ? path(stripLocalePrefix(new URL(item.url).pathname))
          : item.url;
        const isExternal = !url.startsWith('/');
        return isExternal ? (
          <a href={url} key={item.id} rel="noopener noreferrer" target="_blank">
            {item.title}
          </a>
        ) : (
          <NavLink
            end
            key={item.id}
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

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633060920',
      resourceId: 'gid://shopify/ShopPolicy/23358046264',
      tags: [],
      title: 'Privacy Policy',
      type: 'SHOP_POLICY',
      url: '/policies/privacy-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633093688',
      resourceId: 'gid://shopify/ShopPolicy/23358013496',
      tags: [],
      title: 'Refund Policy',
      type: 'SHOP_POLICY',
      url: '/policies/refund-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633126456',
      resourceId: 'gid://shopify/ShopPolicy/23358111800',
      tags: [],
      title: 'Shipping Policy',
      type: 'SHOP_POLICY',
      url: '/policies/shipping-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: 'gid://shopify/ShopPolicy/23358079032',
      tags: [],
      title: 'Terms of Service',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service',
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
    color: isPending ? 'var(--color-canvas-deep)' : 'var(--color-canvas)',
    textDecoration: isActive ? 'underline' : undefined,
    textUnderlineOffset: '6px',
  };
}
