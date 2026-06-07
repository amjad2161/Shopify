import {useFrame, useThree} from '@react-three/fiber';
import {cameraPositionForScroll} from '~/lib/experience-scroll';
import {useSceneStore} from '~/stores/useSceneStore';

/** Scroll-driven camera dolly + orbit for cinematic product discovery. */
export function CameraRig() {
  const scrollProgress = useSceneStore((s) => s.scrollProgress);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  const activeIndex = useSceneStore((s) => s.activeIndex);
  const {camera} = useThree();

  useFrame(() => {
    const {position, lookAt} = cameraPositionForScroll(
      scrollProgress,
      activeIndex,
    );

    if (reducedMotion) {
      camera.position.set(position[0], position[1], position[2]);
      camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
      return;
    }

    camera.position.x += (position[0] - camera.position.x) * 0.06;
    camera.position.y += (position[1] - camera.position.y) * 0.06;
    camera.position.z += (position[2] - camera.position.z) * 0.06;
    camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
  });

  return null;
}
