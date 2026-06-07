import {useGLTF} from '@react-three/drei';

/** Google-hosted Draco decoder — no local asset copy required. */
export const DRACO_DECODER_PATH =
  'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';

let dracoConfigured = false;

/** Configure Draco once before loading compressed GLB assets. */
export function ensureDracoDecoder(): void {
  if (dracoConfigured || typeof window === 'undefined') return;
  useGLTF.setDecoderPath(DRACO_DECODER_PATH);
  dracoConfigured = true;
}

export type Model3dSource = {
  url: string;
  format?: string | null;
};

/** Pick the best GLB/GLTF source from Shopify Model3d sources. */
export function pickModel3dSource(
  sources: Array<{url?: string | null; format?: string | null; mimeType?: string | null}> | null | undefined,
): Model3dSource | undefined {
  if (!sources?.length) return undefined;

  const ranked = [...sources].sort((a, b) => {
    const score = (s: typeof a) => {
      const format = (s.format ?? s.mimeType ?? '').toLowerCase();
      if (format.includes('glb')) return 0;
      if (format.includes('gltf')) return 1;
      return 2;
    };
    return score(a) - score(b);
  });

  const best = ranked.find((s) => s.url);
  if (!best?.url) return undefined;

  return {url: best.url, format: best.format ?? best.mimeType};
}

/** Preload a GLB in the background (no-op on server). */
export function preloadGlb(url: string): void {
  if (typeof window === 'undefined' || !url) return;
  ensureDracoDecoder();
  useGLTF.preload(url);
}
