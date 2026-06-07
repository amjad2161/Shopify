import {Environment, ContactShadows} from '@react-three/drei';
import {useSceneStore} from '~/stores/useSceneStore';

/** Pixar-inspired studio lighting — soft key, warm fill, deep grounding shadow. */
export function StudioStage() {
  const isMobile = useSceneStore((s) => s.isMobile);

  return (
    <>
      <color attach="background" args={['#f4efe8']} />
      <fog attach="fog" args={['#f4efe8', 8, 22]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow={!isMobile}
        position={[4, 6, 5]}
        intensity={1.15}
        shadow-mapSize={isMobile ? [512, 512] : [1024, 1024]}
      />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} color="#ffe8c8" />
      <pointLight position={[0, 3, 2]} intensity={0.25} color="#fff5eb" />
      <Environment preset="studio" />
      {!isMobile ? (
        <ContactShadows
          position={[0, -1.35, 0]}
          opacity={0.42}
          scale={12}
          blur={2.4}
          far={6}
        />
      ) : null}
    </>
  );
}
