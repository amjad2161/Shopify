import {lazy, Suspense, useCallback, useEffect, useState} from 'react';
import {useNavigate} from 'react-router';
import {useAnalytics} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {ClientOnly} from '~/components/ClientOnly';
import {ExperienceOverlay} from '~/components/experience/ExperienceOverlay';
import {ExperienceErrorBoundary} from '~/components/experience/ExperienceErrorBoundary';
import {ClassicHomepage} from '~/components/home/ClassicHomepage';
import {
  mapProductsToScene,
  sceneProductsWithModels,
} from '~/lib/three/map-products';
import {preloadGlb} from '~/lib/three/load-glb';
import {publishExperienceEvent} from '~/lib/experience-analytics';
import {useDevice3dProfile} from '~/hooks/useDevice3dProfile';
import {useGsapExperience} from '~/hooks/useGsapExperience';
import {useWebGLSupport} from '~/hooks/useWebGLSupport';
import {useExperienceAnalytics} from '~/hooks/useExperienceAnalytics';
import {useI18n} from '~/lib/i18n/I18nProvider';

const SceneCanvas = lazy(() =>
  import('~/components/scene/SceneCanvas').then((m) => ({
    default: m.SceneCanvas,
  })),
);

type ImmersiveHomeProps = {
  products: RecommendedProductsQuery['products']['nodes'];
  collectionHandle?: string;
  featuredCollection: FeaturedCollectionFragment | null;
  recommendedProducts: Promise<RecommendedProductsQuery | null>;
};

export function ImmersiveHome({
  products,
  collectionHandle,
  featuredCollection,
  recommendedProducts,
}: ImmersiveHomeProps) {
  const navigate = useNavigate();
  const {path} = useI18n();
  const {publish} = useAnalytics();
  const sceneProducts = mapProductsToScene(products);
  const {scrollRef, focusAtIndex} = useGsapExperience(sceneProducts);
  const {checked, supported} = useWebGLSupport();
  const [runtimeFallback, setRuntimeFallback] = useState(false);

  useDevice3dProfile();
  useExperienceAnalytics(!runtimeFallback && supported);

  useEffect(() => {
    if (!checked || supported) return;
    publishExperienceEvent(publish, {
      event: '3d_fallback',
      reason: 'webgl_unavailable',
    });
  }, [checked, publish, supported]);

  useEffect(() => {
    for (const product of sceneProductsWithModels(sceneProducts)) {
      if (product.modelUrl) preloadGlb(product.modelUrl);
    }
  }, [sceneProducts]);

  const onProductFocus = useCallback(
    (_handle: string, index: number) => {
      focusAtIndex(index);
    },
    [focusAtIndex],
  );

  const onProductOpen = useCallback(
    (handle: string) => {
      void navigate(path(`/products/${handle}`));
    },
    [navigate, path],
  );

  const onRuntimeFallback = useCallback(
    (reason: string) => {
      setRuntimeFallback(true);
      publishExperienceEvent(publish, {
        event: '3d_fallback',
        reason,
      });
    },
    [publish],
  );

  if ((checked && !supported) || runtimeFallback) {
    return (
      <ClassicHomepage
        featuredCollection={featuredCollection}
        recommendedProducts={recommendedProducts}
      />
    );
  }

  return (
    <section className="experience-shell" aria-label="3D storefront">
      <div className="experience-canvas-layer" aria-hidden="true">
        <ClientOnly
          fallback={<div className="experience-canvas-fallback" />}
        >
          <ExperienceErrorBoundary
            onFallback={onRuntimeFallback}
            publish={publish}
          >
            <Suspense fallback={<div className="experience-canvas-fallback" />}>
              <SceneCanvas
                products={sceneProducts}
                onProductFocus={onProductFocus}
                onProductOpen={onProductOpen}
              />
            </Suspense>
          </ExperienceErrorBoundary>
        </ClientOnly>
      </div>

      <div className="experience-scroll" ref={scrollRef}>
        <div className="experience-scroll-spacer" />
        <ExperienceOverlay
          products={sceneProducts}
          collectionHandle={collectionHandle}
          onFocusIndex={focusAtIndex}
        />
        <div className="experience-scroll-spacer experience-scroll-spacer--tail" />
      </div>
    </section>
  );
}
