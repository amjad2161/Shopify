import {describe, expect, it} from 'vitest';
import {DRACO_DECODER_PATH, pickModel3dSource} from '~/lib/three/load-glb';

describe('pickModel3dSource', () => {
  it('prefers glb over gltf', () => {
    const picked = pickModel3dSource([
      {url: 'https://cdn.shopify.com/model.gltf', format: 'gltf'},
      {url: 'https://cdn.shopify.com/model.glb', format: 'glb'},
    ]);

    expect(picked?.url).toContain('model.glb');
  });

  it('returns undefined when no sources have URLs', () => {
    expect(pickModel3dSource([{url: null, format: 'glb'}])).toBeUndefined();
    expect(pickModel3dSource([])).toBeUndefined();
  });
});

describe('DRACO_DECODER_PATH', () => {
  it('points at the Google-hosted decoder', () => {
    expect(DRACO_DECODER_PATH).toContain('gstatic.com/draco');
  });
});
