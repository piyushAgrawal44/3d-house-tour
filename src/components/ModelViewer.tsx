import { useGLTF, OrbitControls, Environment, Sky, useProgress } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import { Canvas, useThree, useFrame, useLoader, } from '@react-three/fiber';
import * as THREE from 'three';
import { createPortal } from 'react-dom';
import ModelDialog from './ModalDialog';
useGLTF.preload('/models/city.glb');
useGLTF.preload('/models/burj_building.glb');
interface HoverInfo {
  name: string;
  type: string;
  materialType: string;
  color: string;
  position: string;
  distance: string;
}

interface ModelSceneProps {
  setHoverInfo: React.Dispatch<React.SetStateAction<HoverInfo | null>>;
  setIsDialogOpen: any;
}

function PageLoader() {
  const { progress } = useProgress();

  return (
    <div className="fixed w-full h-full inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
        <p className="text-white text-lg">{Math.floor(progress)}% loading</p>
      </div>
    </div>
  );
}
const Grass = () => {
  const grassTextureUrl = '/textures/grass.jpeg'
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
  const { scene } = useGLTF('/models/burj_building.glb') as { scene: THREE.Group };
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const hoveredMeshRef = useRef<THREE.Mesh | null>(null);
  const originalMaterialRef: any = useRef<THREE.Material | null>(null);
  const { camera, gl } = useThree();

  const highlightMaterial = new THREE.MeshStandardMaterial({
    color: '#4FC3F7',
    emissive: '#4FC3F7',
    transparent: true,
    opacity: 0.7,
  });



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
        });
      }
    }
  });

  return (
    <>
      <primitive object={scene} scale={1.5} />
    </>
  );
}


function CityScene() {
  const { scene } = useGLTF('/models/city.glb');

  // ⚠️ This part requires tuning for every city model
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <primitive
      object={scene}
      scale={[0.5, 0.5, 0.5]}     // ⬅️ Tune this
      position={[37, -2, -133]}      // ⬅️ Tune this
      rotation={[0, Math.PI, 0]}   // ⬅️ Optional: Adjust orientation
    />
  );
}


export default function ModelViewer() {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true)
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
      {isLoading && <PageLoader />}

      <Canvas onCreated={() => setIsLoading(false)} camera={{ position: [0, 22, 100], fov: 50 }}>
        <Sky distance={450000} sunPosition={[5, 1, 8]} inclination={0} azimuth={0.25} />
        <Grass />
        <CityScene />
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
