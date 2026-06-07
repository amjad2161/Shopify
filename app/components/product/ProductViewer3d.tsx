import {lazy, Suspense, useEffect, useState} from 'react';
import {useAnalytics} from '@shopify/hydrogen';
import {ClientOnly} from '~/components/ClientOnly';
import {ProductImage} from '~/components/ProductImage';
import {publishExperienceEvent} from '~/lib/experience-analytics';
import {detectWebGLSupport} from '~/lib/three/webgl';
import type {ProductVariantFragment} from 'storefrontapi.generated';

const ProductViewerCanvas = lazy(() =>
  import('~/components/product/ProductViewerCanvas').then((m) => ({
    default: m.ProductViewerCanvas,
  })),
);

type ProductViewer3dProps = {
  modelUrl?: string;
  image?: ProductVariantFragment['image'];
  title: string;
};

/** PDP 3D viewer with image fallback when WebGL or GLB is unavailable. */
export function ProductViewer3d({modelUrl, image, title}: ProductViewer3dProps) {
  const {publish} = useAnalytics();
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    setWebglOk(detectWebGLSupport());
  }, []);

  useEffect(() => {
    if (modelUrl && webglOk) {
      publishExperienceEvent(publish, {
        event: '3d_pdp_viewer_open',
        handle: title,
      });
    }
  }, [modelUrl, publish, title, webglOk]);

  if (!modelUrl || !webglOk) {
    return <ProductImage image={image} />;
  }

  return (
    <div className="product-viewer-3d" aria-label={title}>
      <ClientOnly fallback={<ProductImage image={image} />}>
        <Suspense fallback={<ProductImage image={image} />}>
          <ProductViewerCanvas modelUrl={modelUrl} title={title} />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
