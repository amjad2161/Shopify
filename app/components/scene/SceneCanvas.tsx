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
  onProductSelect: (handle: string) => void;
};

function SceneContent({
  products,
  onProductSelect,
}: SceneCanvasProps) {
  const {publish} = useAnalytics();
  const setFocus = useSceneStore((s) => s.setFocus);

  const handleSelect = useCallback(
    (handle: string) => {
      const product = products.find((item) => item.handle === handle);
      if (product) {
        setFocus({
          id: product.id,
          handle: product.handle,
          title: product.title,
        });
        publishExperienceEvent(publish, {
          event: '3d_orb_click',
          handle: product.handle,
        });
      }
      onProductSelect(handle);
    },
    [onProductSelect, products, publish, setFocus],
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
          onSelect={handleSelect}
        />
      ))}
    </>
  );
}

export function SceneCanvas({products, onProductSelect}: SceneCanvasProps) {
  const dpr = useCanvasDpr();

  useEffect(() => {
    for (const product of sceneProductsWithModels(products)) {
      if (product.modelUrl) preloadGlb(product.modelUrl);
    }
  }, [products]);

  return (
    <Canvas
      className="experience-canvas"
      dpr={dpr}
      shadows
      camera={{position: [0, 0.4, 7.5], fov: 42, near: 0.1, far: 40}}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
    >
      <Suspense fallback={null}>
        <SceneContent products={products} onProductSelect={onProductSelect} />
      </Suspense>
    </Canvas>
  );
}
