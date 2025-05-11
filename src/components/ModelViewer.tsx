import { useGLTF, OrbitControls, Environment, Sky } from '@react-three/drei';
import { useEffect, useRef, useState, type JSX } from 'react';
import { Canvas, useThree, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { createPortal } from 'react-dom';
import ModelDialog from './ModalDialog';
import grassTextureUrl from '/textures/grass.jpeg';

interface HoverInfo {
  name: string;
  type: string;
  materialType: string;
  color: string;
  position: string;
  distance: string;
  mesh: THREE.Mesh;
}

interface ModelSceneProps {
  setHoverInfo: React.Dispatch<React.SetStateAction<HoverInfo | null>>;
  setIsDialogOpen: any;
}

const Grass = () => {
  const texture = useLoader(THREE.TextureLoader, grassTextureUrl);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(100, 100);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
};

function ModelScene({ setHoverInfo, setIsDialogOpen }: ModelSceneProps) {
  const { scene } = useGLTF('/models/modern_building.glb') as { scene: THREE.Group };
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const hoveredMeshRef = useRef<THREE.Mesh | null>(null);
  const originalMaterialRef:any = useRef<THREE.Material | null>(null);
  const { camera, gl } = useThree();

  const highlightMaterial = new THREE.MeshStandardMaterial({
    color: '#4FC3F7',
    emissive: '#4FC3F7',
    transparent: true,
    opacity: 0.7,
  });

  // Function to create duplicates of the main building
  const createBuildingCluster = (numberOfBuildings: number, radius: number) => {
    const buildings: JSX.Element[] = [];
    const buildingClone = scene.clone(); // clone the scene once

    for (let i = 0; i < numberOfBuildings; i++) {
      const angle = (i / numberOfBuildings) * Math.PI * 2; // equally spaced in a circle
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Clone the building and set its position
      const buildingInstance = buildingClone.clone();
      buildingInstance.position.set(x, 0, z);

      buildings.push(
        <primitive key={i} object={buildingInstance} scale={1.5} />
      );
    }
    return buildings;
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      const { width, height, left, top } = gl.domElement.getBoundingClientRect();

      mouse.current.x = ((clientX - left) / width) * 2 - 1;
      mouse.current.y = -((clientY - top) / height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        console.log("first", intersects);
        setIsDialogOpen(true);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      const { width, height, left, top } = gl.domElement.getBoundingClientRect();

      mouse.current.x = ((clientX - left) / width) * 2 - 1;
      mouse.current.y = -((clientY - top) / height) * 2 + 1;
    };

    gl.domElement.addEventListener('dblclick', handleClick);
    gl.domElement.addEventListener('mousemove', handleMouseMove);

    return () => {
      gl.domElement.removeEventListener('dblclick', handleClick);
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl]);

  useFrame(() => {
    raycaster.current.setFromCamera(mouse.current, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    if (intersects.length === 0 || intersects[0].object !== hoveredMeshRef.current) {
      if (hoveredMeshRef.current && originalMaterialRef.current) {
        hoveredMeshRef.current.material = originalMaterialRef.current;
        hoveredMeshRef.current = null;
        originalMaterialRef.current = null;
        setHoverInfo(null);
      }
    }

    if (intersects.length > 0) {
      const hovered = intersects[0].object as THREE.Mesh;

      if (hovered !== hoveredMeshRef.current && hovered.isMesh) {
        if (hoveredMeshRef.current && originalMaterialRef.current) {
          hoveredMeshRef.current.material = originalMaterialRef.current;
        }

        hoveredMeshRef.current = hovered;
        originalMaterialRef.current = hovered.material;
        hovered.material = highlightMaterial;

        const material = originalMaterialRef.current as THREE.Material & { color?: THREE.Color };
        const materialType = material.type;
        const color = material.color ? `#${material.color.getHexString()}` : 'N/A';

        setHoverInfo({
          name: hovered.name || 'Unnamed Object',
          type: hovered.type,
          materialType,
          color,
          position: `X: ${hovered.position.x.toFixed(2)}, Y: ${hovered.position.y.toFixed(2)}, Z: ${hovered.position.z.toFixed(2)}`,
          distance: intersects[0].distance.toFixed(2),
          mesh: hovered.clone(), // clone for preview
        });
      }
    }
  });

  const buildings = createBuildingCluster(2, 70); // 5 buildings around the main one

  return (
    <>
      {buildings}
      <primitive object={scene} scale={1.5} />
    </>
  );
}

export default function ModelViewer() {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${mousePosition.x + 20}px`,
    top: `${mousePosition.y + 20}px`,
    pointerEvents: 'none',
    display: 'flex',
    gap: '1rem',
    zIndex: 9999,
  };

  return (
    <>
      <Canvas camera={{ position: [0, 2, 50], fov: 50 }}>
        <Sky distance={450000} sunPosition={[5, 1, 8]} inclination={0} azimuth={0.25} />
        <Grass />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Environment preset="city" />
        <ModelScene setHoverInfo={setHoverInfo} setIsDialogOpen={setIsDialogOpen} />
        <OrbitControls />
      </Canvas>

      {hoverInfo && createPortal(
        <div style={panelStyle}>
          <div className="bg-gray-800 text-white p-4 rounded-md shadow-lg w-64 border border-blue-400">
            <h3 className="text-lg font-bold text-blue-300 mb-2">{hoverInfo.name}</h3>
            <div className="space-y-1 text-sm">
              <p className="flex justify-between">
                <span className="font-medium text-gray-300">Type:</span>
                <span>{hoverInfo.type}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium text-gray-300">Material:</span>
                <span>{hoverInfo.materialType}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium text-gray-300">Color:</span>
                <span className="flex items-center">
                  {hoverInfo.color}
                  <span
                    className="ml-2 inline-block w-4 h-4 rounded-full border border-gray-400"
                    style={{ backgroundColor: hoverInfo.color }}
                  />
                </span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium text-gray-300">Distance:</span>
                <span>{hoverInfo.distance} units</span>
              </p>
              <div className="mt-2">
                <p className="font-medium text-gray-300 mb-1">Position:</p>
                <p className="text-xs">{hoverInfo.position}</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isDialogOpen && (
        <ModelDialog isOpen={!!isDialogOpen} onClose={() => setIsDialogOpen(false)} info={isDialogOpen} />
      )}
    </>
  );
}
