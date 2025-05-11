// App.tsx
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef, useState } from 'react';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

const imageUrl = '/room/room1.jpg';

function Hotspot({ position, label, onClick }: any) {
  return (
    <Html position={position}>
      <button
        className="bg-white text-black px-2 py-1 rounded hover:bg-blue-300 shadow"
        onClick={onClick}
      >
        {label}
      </button>
    </Html>
  );
}

function PanoramaScene({
  targetPosition,
  setTargetPosition,
}: {
  targetPosition: THREE.Vector3;
  setTargetPosition: (v: THREE.Vector3) => void;
}) {
  const texture = new THREE.TextureLoader().load(imageUrl);
  texture.mapping = THREE.EquirectangularReflectionMapping;

  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useFrame(() => {
    // Lerp camera position toward target position
    camera.position.lerp(targetPosition, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <primitive attach="background" object={texture} />
      <OrbitControls ref={controlsRef} enableZoom={false} enablePan={false} enableRotate={false} />

      <Hotspot
        position={[10, 0, 0]}
        label="Go Right"
        onClick={() => {
          setTargetPosition(new THREE.Vector3(10, 0, 0));
        }}
      />

      <Hotspot
        position={[-10, 0, 0]}
        label="Go Left"
        onClick={() => {
          setTargetPosition(new THREE.Vector3(-10, 0, 0));
        }}
      />

      <Hotspot
        position={[0, 0, -10]}
        label="Go Forward"
        onClick={() => {
          setTargetPosition(new THREE.Vector3(0, 0, -10));
        }}
      />
    </>
  );
}

function RoomTour() {
  const [targetPosition, setTargetPosition] = useState<THREE.Vector3>(
    new THREE.Vector3(0, 0, 0.1)
  );

  return (
    <div className="w-screen h-screen">
      <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }}>
        <Suspense fallback={null}>
          <PanoramaScene
            targetPosition={targetPosition}
            setTargetPosition={setTargetPosition}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default RoomTour;
