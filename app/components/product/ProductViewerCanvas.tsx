import {Suspense, useMemo} from 'react';
import {Canvas} from '@react-three/fiber';
import {Center, Environment, OrbitControls, useGLTF} from '@react-three/drei';
import {ensureDracoDecoder} from '~/lib/three/load-glb';
import {useCanvasDpr} from '~/hooks/useDevice3dProfile';

type ProductViewerCanvasProps = {
  modelUrl: string;
  title: string;
};

function Model({modelUrl}: {modelUrl: string}) {
  ensureDracoDecoder();
  const {scene} = useGLTF(modelUrl);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  return (
    <Center>
      <primitive object={cloned} scale={1.1} />
    </Center>
  );
}

export function ProductViewerCanvas({modelUrl, title}: ProductViewerCanvasProps) {
  const dpr = useCanvasDpr();

  return (
    <Canvas
      className="product-viewer-3d__canvas"
      dpr={dpr}
      camera={{position: [0, 0.2, 2.8], fov: 42}}
      gl={{antialias: true, alpha: true}}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} />
      <Environment preset="studio" />
      <Suspense fallback={null}>
        <Model modelUrl={modelUrl} />
      </Suspense>
      <OrbitControls
        enablePan={false}
        minDistance={1.6}
        maxDistance={4.5}
        aria-label={title}
      />
    </Canvas>
  );
}
