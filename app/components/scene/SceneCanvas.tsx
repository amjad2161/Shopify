import {Suspense, useCallback, useEffect} from 'react';
import {Canvas} from '@react-three/fiber';
import {useAnalytics} from '@shopify/hydrogen';
import type {SceneProduct} from '~/lib/three/map-products';
import {sceneProductsWithModels} from '~/lib/three/map-products';
import {preloadGlb} from '~/lib/three/load-glb';
import {publishExperienceEvent} from '~/lib/experience-analytics';
import {StudioStage} from '~/components/scene/StudioStage';
import {ProductSceneItem} from '~/components/scene/ProductSceneItem';
import {CameraRig} from '~/components/scene/CameraRig';
import {useCanvasDpr} from '~/hooks/useDevice3dProfile';
import {useSceneStore} from '~/stores/useSceneStore';

type SceneCanvasProps = {
  products: SceneProduct[];
  onProductFocus: (handle: string, index: number) => void;
  onProductOpen: (handle: string) => void;
};

function SceneContent({
  products,
  onProductFocus,
  onProductOpen,
}: SceneCanvasProps) {
  const {publish} = useAnalytics();
  const setFocus = useSceneStore((s) => s.setFocus);

  const handleFocus = useCallback(
    (handle: string, index: number) => {
      const product = products.find((item) => item.handle === handle);
      if (product) {
        setFocus({
          id: product.id,
          handle: product.handle,
          title: product.title,
        });
        publishExperienceEvent(publish, {
          event: '3d_orb_focus',
          handle: product.handle,
        });
      }
      onProductFocus(handle, index);
    },
    [onProductFocus, products, publish, setFocus],
  );

  const handleOpen = useCallback(
    (handle: string) => {
      publishExperienceEvent(publish, {
        event: '3d_orb_click',
        handle,
      });
      onProductOpen(handle);
    },
    [onProductOpen, publish],
  );

  return (
    <>
      <CameraRig />
      <StudioStage />
      {products.map((product, index) => (
        <ProductSceneItem
          key={product.id}
          product={product}
          index={index}
          onFocus={handleFocus}
          onOpen={handleOpen}
        />
      ))}
    </>
  );
}

export function SceneCanvas({products, onProductFocus, onProductOpen}: SceneCanvasProps) {
  const dpr = useCanvasDpr();
  const isMobile = useSceneStore((s) => s.isMobile);

  useEffect(() => {
    for (const product of sceneProductsWithModels(products)) {
      if (product.modelUrl) preloadGlb(product.modelUrl);
    }
  }, [products]);

  return (
    <Canvas
      className="experience-canvas"
      dpr={dpr}
      shadows={!isMobile}
      camera={{position: [0, 0.4, 7.5], fov: 42, near: 0.1, far: 40}}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
    >
      <Suspense fallback={null}>
        <SceneContent
          products={products}
          onProductFocus={onProductFocus}
          onProductOpen={onProductOpen}
        />
      </Suspense>
    </Canvas>
  );
}
