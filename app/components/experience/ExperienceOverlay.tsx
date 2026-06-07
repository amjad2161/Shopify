import {Link} from 'react-router';
import type {SceneProduct} from '~/lib/three/map-products';
import {isLowStock} from '~/lib/three/map-products';
import {useBrand} from '~/hooks/useBrand';
import {useSceneStore} from '~/stores/useSceneStore';
import {useI18n} from '~/lib/i18n/I18nProvider';
import {ExperienceProductRail} from '~/components/experience/ExperienceProductRail';
import {useExperienceFocusAnimation} from '~/hooks/useExperienceFocusAnimation';

type ExperienceOverlayProps = {
  products: SceneProduct[];
  collectionHandle?: string;
  onFocusIndex: (index: number) => void;
};

export function ExperienceOverlay({
  products,
  collectionHandle = 'all',
  onFocusIndex,
}: ExperienceOverlayProps) {
  const {t, path} = useI18n();
  const brand = useBrand();
  const activeIndex = useSceneStore((s) => s.activeIndex);
  const focus = products[activeIndex] ?? products[0];
  const focusPanelRef = useExperienceFocusAnimation(activeIndex);

  return (
    <div className="experience-overlay">
      <header className="experience-header">
        <p className="experience-eyebrow">{t('home.hero.eyebrow')}</p>
        <h1 className="experience-title font-display">{brand.name}</h1>
        <p className="experience-tagline">{t('brand.tagline')}</p>
      </header>

      <ExperienceProductRail
        products={products}
        onFocusIndex={onFocusIndex}
      />

      {focus ? (
        <aside
          ref={focusPanelRef}
          className="experience-focus"
          aria-live="polite"
        >
          <p className="experience-focus-label">{t('home.recommended.eyebrow')}</p>
          <h2 className="experience-focus-title font-display">{focus.title}</h2>
          {focus.priceLabel ? (
            <p className="experience-focus-price">{focus.priceLabel}</p>
          ) : null}
          {isLowStock(focus.totalInventory) ? (
            <p className="experience-focus-stock" role="status">
              {t('product.lowStock', {count: focus.totalInventory ?? 0})}
            </p>
          ) : null}
          <p className="experience-focus-hint">{t('experience.focus.hint')}</p>
          <Link
            className="experience-cta"
            to={path(`/products/${focus.handle}`)}
          >
            {t('experience.focus.cta')}
          </Link>
        </aside>
      ) : null}

      <footer className="experience-footer">
        <Link className="experience-cta experience-cta-secondary" to={path('/collections/all')}>
          {t('home.hero.shopEdit')}
        </Link>
        {collectionHandle ? (
          <Link
            className="experience-cta experience-cta-ghost"
            to={path(`/collections/${collectionHandle}`)}
          >
            {t('home.hero.featuredCollection')}
          </Link>
        ) : null}
      </footer>

      <div className="experience-scroll-hint" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
