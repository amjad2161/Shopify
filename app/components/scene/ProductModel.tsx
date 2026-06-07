import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useFrame} from '@react-three/fiber';
import {Center, Float, useGLTF} from '@react-three/drei';
import type {Group} from 'three';
import type {SceneProduct} from '~/lib/three/map-products';
import {ensureDracoDecoder} from '~/lib/three/load-glb';
import {useSceneStore} from '~/stores/useSceneStore';

type ProductModelProps = {
  product: SceneProduct;
  index: number;
  onSelect: (handle: string) => void;
  onFailed?: () => void;
};

function ProductModelMesh({
  product,
  index,
  onSelect,
}: Omit<ProductModelProps, 'onFailed'>) {
  ensureDracoDecoder();
  const {scene} = useGLTF(product.modelUrl!);
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const activeIndex = useSceneStore((s) => s.activeIndex);
  const scrollProgress = useSceneStore((s) => s.scrollProgress);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  const isActive = activeIndex === index;

  const cloned = useMemo(() => scene.clone(true), [scene]);

  useFrame((state) => {
    if (!groupRef.current || reducedMotion) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y =
      t * 0.12 + index * 0.35 + scrollProgress * Math.PI * 0.75;
    const scale = isActive || hovered ? 1.15 : 1;
    groupRef.current.scale.lerp({x: scale, y: scale, z: scale} as never, 0.08);
  });

  return (
    <Float
      speed={reducedMotion ? 0 : 1.2}
      rotationIntensity={reducedMotion ? 0 : 0.2}
      floatIntensity={reducedMotion ? 0 : 0.45}
    >
      <group
        ref={groupRef}
        position={product.position}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(product.handle);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <Center>
          <primitive object={cloned} scale={0.95} />
        </Center>
      </group>
    </Float>
  );
}

/** GLB product with automatic fallback when the asset fails to load. */
export function ProductModel({onFailed, ...props}: ProductModelProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [props.product.modelUrl]);

  useEffect(() => {
    if (failed) onFailed?.();
  }, [failed, onFailed]);

  if (!props.product.modelUrl || failed) {
    return null;
  }

  return (
    <ModelErrorBoundary onError={() => setFailed(true)}>
      <ProductModelMesh {...props} />
    </ModelErrorBoundary>
  );
}

class ModelErrorBoundary extends React.Component<
  {children: React.ReactNode; onError: () => void},
  {hasError: boolean}
> {
  state = {hasError: false};

  static getDerivedStateFromError() {
    return {hasError: true};
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
