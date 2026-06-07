import {lazy, useCallback} from 'react';
import {useNavigate} from 'react-router';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {ClientOnly} from '~/components/ClientOnly';
import {ExperienceOverlay} from '~/components/experience/ExperienceOverlay';
import {mapProductsToScene} from '~/lib/three/map-products';
import {useDevice3dProfile} from '~/hooks/useDevice3dProfile';
import {useGsapExperience} from '~/hooks/useGsapExperience';
import {useI18n} from '~/lib/i18n/I18nProvider';

const SceneCanvas = lazy(() =>
  import('~/components/scene/SceneCanvas').then((m) => ({
    default: m.SceneCanvas,
  })),
);

type ImmersiveHomeProps = {
  products: RecommendedProductsQuery['products']['nodes'];
  collectionHandle?: string;
};

export function ImmersiveHome({products, collectionHandle}: ImmersiveHomeProps) {
  const navigate = useNavigate();
  const {path} = useI18n();
  const sceneProducts = mapProductsToScene(products);
  const scrollRef = useGsapExperience(sceneProducts.length);

  useDevice3dProfile();

  const onProductSelect = useCallback(
    (handle: string) => {
      navigate(path(`/products/${handle}`));
    },
    [navigate, path],
  );

  return (
    <section className="experience-shell" aria-label="3D storefront">
      <div className="experience-canvas-layer" aria-hidden="true">
        <ClientOnly
          fallback={<div className="experience-canvas-fallback" />}
        >
          <SceneCanvas
            products={sceneProducts}
            onProductSelect={onProductSelect}
          />
        </ClientOnly>
      </div>

      <div className="experience-scroll" ref={scrollRef}>
        <div className="experience-scroll-spacer" />
        <ExperienceOverlay
          products={sceneProducts}
          collectionHandle={collectionHandle}
        />
        <div className="experience-scroll-spacer experience-scroll-spacer--tail" />
      </div>
    </section>
  );
}
