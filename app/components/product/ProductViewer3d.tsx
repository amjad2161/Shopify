import {lazy, Suspense, useEffect} from 'react';
import {useRouteLoaderData} from 'react-router';
import {useAnalytics} from '@shopify/hydrogen';
import {ClientOnly} from '~/components/ClientOnly';
import {ProductImage} from '~/components/ProductImage';
import {publishExperienceEvent} from '~/lib/experience-analytics';
import {useWebGLSupport} from '~/hooks/useWebGLSupport';
import type {RootLoader} from '~/root';
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
  handle: string;
};

/** PDP 3D viewer with image fallback when WebGL or GLB is unavailable. */
export function ProductViewer3d({
  modelUrl,
  image,
  title,
  handle,
}: ProductViewer3dProps) {
  const {publish} = useAnalytics();
  const {checked, supported} = useWebGLSupport();
  const root = useRouteLoaderData<RootLoader>('root');
  const immersive3dEnabled = Boolean(root?.immersive3dEnabled);
  const canRender3d =
    immersive3dEnabled && Boolean(modelUrl) && checked && supported;

  useEffect(() => {
    if (canRender3d) {
      publishExperienceEvent(publish, {
        event: '3d_pdp_viewer_open',
        handle,
      });
    }
  }, [canRender3d, handle, publish]);

  if (!canRender3d || !modelUrl) {
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
