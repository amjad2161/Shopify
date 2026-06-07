import {Suspense} from 'react';
import {Canvas} from '@react-three/fiber';
import {Preload} from '@react-three/drei';
import type {SceneProduct} from '~/lib/three/map-products';
import {StudioStage} from '~/components/scene/StudioStage';
import {ProductOrb} from '~/components/scene/ProductOrb';
import {useCanvasDpr} from '~/hooks/useDevice3dProfile';

type SceneCanvasProps = {
  products: SceneProduct[];
  onProductSelect: (handle: string) => void;
};

function SceneContent({
  products,
  onProductSelect,
}: SceneCanvasProps) {
  return (
    <>
      <StudioStage />
      {products.map((product, index) => (
        <ProductOrb
          key={product.id}
          product={product}
          index={index}
          onSelect={onProductSelect}
        />
      ))}
      <Preload all />
    </>
  );
}

export function SceneCanvas({products, onProductSelect}: SceneCanvasProps) {
  const dpr = useCanvasDpr();

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
