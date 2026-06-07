import {useRef} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import type {Group} from 'three';
import {useSceneStore} from '~/stores/useSceneStore';

const BASE_POSITION: [number, number, number] = [0, 0.4, 7.5];
const SCROLL_POSITION: [number, number, number] = [0.35, 0.85, 5.8];

/** Scroll-driven camera dolly + orbit for cinematic product discovery. */
export function CameraRig() {
  const groupRef = useRef<Group>(null);
  const scrollProgress = useSceneStore((s) => s.scrollProgress);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  const activeIndex = useSceneStore((s) => s.activeIndex);
  const {camera} = useThree();

  useFrame(() => {
    if (reducedMotion) return;

    const t = scrollProgress;
    const x = BASE_POSITION[0] + (SCROLL_POSITION[0] - BASE_POSITION[0]) * t;
    const y = BASE_POSITION[1] + (SCROLL_POSITION[1] - BASE_POSITION[1]) * t;
    const z = BASE_POSITION[2] + (SCROLL_POSITION[2] - BASE_POSITION[2]) * t;

    const orbit = activeIndex * 0.18;
    camera.position.x += (x + Math.sin(orbit) * 0.25 - camera.position.x) * 0.06;
    camera.position.y += (y - camera.position.y) * 0.06;
    camera.position.z += (z - camera.position.z) * 0.06;
    camera.lookAt(0, 0.1, -0.6);
  });

  return <group ref={groupRef} />;
}
