import {useRef, useState} from 'react';
import {useFrame} from '@react-three/fiber';
import {Float, RoundedBox, useTexture} from '@react-three/drei';
import type {Group, Mesh, Texture} from 'three';
import {staticOrbTransform} from '~/lib/experience-scroll';
import type {SceneProduct} from '~/lib/three/map-products';
import {useSceneStore} from '~/stores/useSceneStore';

type ProductOrbProps = {
  product: SceneProduct;
  index: number;
  onSelect: (handle: string) => void;
};

type ProductOrbCoreProps = ProductOrbProps & {
  map: Texture | null;
};

function ProductOrbCore({product, index, onSelect, map}: ProductOrbCoreProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const activeIndex = useSceneStore((s) => s.activeIndex);
  const scrollProgress = useSceneStore((s) => s.scrollProgress);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  const isMobile = useSceneStore((s) => s.isMobile);
  const isActive = activeIndex === index;
  const enableShadows = !isMobile;

  useFrame((state) => {
    if (!groupRef.current) return;

    if (reducedMotion) {
      const {rotationY, scale} = staticOrbTransform(
        index,
        scrollProgress,
        isActive,
        hovered,
      );
      groupRef.current.rotation.y = rotationY;
      groupRef.current.scale.set(scale, scale, scale);
      return;
    }

    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y =
      t * 0.15 + index * 0.4 + scrollProgress * Math.PI;
    const scale = isActive || hovered ? 1.12 : 1;
    groupRef.current.scale.lerp(
      {x: scale, y: scale, z: scale} as never,
      0.08,
    );
  });

  const color = `hsl(${product.hue * 360} 68% 62%)`;

  return (
    <Float
      speed={reducedMotion ? 0 : 1.4}
      rotationIntensity={reducedMotion ? 0 : 0.25}
      floatIntensity={reducedMotion ? 0 : 0.6}
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
        <RoundedBox
          ref={meshRef}
          args={[1.1, 1.1, 1.1]}
          radius={0.28}
          smoothness={6}
          castShadow={enableShadows}
          receiveShadow={enableShadows}
        >
          <meshStandardMaterial
            color={color}
            map={map ?? undefined}
            roughness={0.35}
            metalness={0.08}
            emissive={isActive ? color : '#000000'}
            emissiveIntensity={isActive ? 0.22 : 0}
          />
        </RoundedBox>
      </group>
    </Float>
  );
}

function ProductOrbTextured(props: ProductOrbProps & {imageUrl: string}) {
  const map = useTexture(props.imageUrl);
  return <ProductOrbCore {...props} map={map} />;
}

export function ProductOrb(props: ProductOrbProps) {
  if (props.product.imageUrl) {
    return <ProductOrbTextured {...props} imageUrl={props.product.imageUrl} />;
  }
  return <ProductOrbCore {...props} map={null} />;
}
