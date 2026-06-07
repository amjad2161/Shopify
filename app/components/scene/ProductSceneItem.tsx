import {Suspense, useCallback, useState} from 'react';
import type {SceneProduct} from '~/lib/three/map-products';
import {ProductModel} from '~/components/scene/ProductModel';
import {ProductOrb} from '~/components/scene/ProductOrb';

type ProductSceneItemProps = {
  product: SceneProduct;
  index: number;
  onFocus: (handle: string, index: number) => void;
  onOpen: (handle: string) => void;
};

/** Renders a GLB when available; falls back to the procedural orb on load failure. */
export function ProductSceneItem(props: ProductSceneItemProps) {
  const [forceOrb, setForceOrb] = useState(false);
  const onModelFailed = useCallback(() => setForceOrb(true), []);

  if (!props.product.modelUrl || forceOrb) {
    return <ProductOrb {...props} />;
  }

  return (
    <Suspense fallback={<ProductOrb {...props} />}>
      <ProductModel {...props} onFailed={onModelFailed} />
    </Suspense>
  );
}
