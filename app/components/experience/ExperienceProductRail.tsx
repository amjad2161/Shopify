import {useCallback} from 'react';
import type {SceneProduct} from '~/lib/three/map-products';
import {useSceneStore} from '~/stores/useSceneStore';
import {useI18n} from '~/lib/i18n/I18nProvider';

type ExperienceProductRailProps = {
  products: SceneProduct[];
  onFocusIndex: (index: number) => void;
};

export function ExperienceProductRail({
  products,
  onFocusIndex,
}: ExperienceProductRailProps) {
  const {t} = useI18n();
  const activeIndex = useSceneStore((s) => s.activeIndex);

  const handleSelect = useCallback(
    (index: number) => {
      onFocusIndex(index);
    },
    [onFocusIndex],
  );

  if (products.length <= 1) return null;

  return (
    <nav
      className="experience-rail"
      aria-label={t('experience.rail.label')}
    >
      <p className="experience-rail-eyebrow">{t('experience.rail.eyebrow')}</p>
      <ul className="experience-rail-list">
        {products.map((product, index) => {
          const isActive = index === activeIndex;
          return (
            <li key={product.id}>
              <button
                type="button"
                className={`experience-rail-item${isActive ? ' experience-rail-item--active' : ''}`}
                aria-current={isActive ? 'true' : undefined}
                aria-label={product.title}
                onClick={() => handleSelect(index)}
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt=""
                    width={40}
                    height={40}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span
                    className="experience-rail-swatch"
                    style={{
                      background: `hsl(${product.hue * 360} 68% 62%)`,
                    }}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
