import { useGLTF } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';

export function RoomViewer({ modelPath }: { modelPath?: string }) {
  const { scene } = useGLTF(modelPath ?? '/models/modern_building.glb');
  const { camera, gl } = useThree();
  const navigate = useNavigate();

  // const [hoveredMesh, setHoveredMesh] = useState<THREE.Mesh | null>(null);
  const originalMaterials = useRef<Map<THREE.Mesh, THREE.Material>>(new Map());

  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // Setup mouse move to track pointer
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { left, top, width, height } = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - left) / width) * 2 - 1;
      mouse.current.y = -((event.clientY - top) / height) * 2 + 1;
    };

    gl.domElement.addEventListener('mousemove', handleMouseMove);
    return () => gl.domElement.removeEventListener('mousemove', handleMouseMove);
  }, [gl]);

  // Click handler using raycasting
  useEffect(() => {
    const handleClick = () => {
      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        const clicked = intersects[0].object;
        console.log('Clicked on:', clicked.name);
        if (clicked.name) {
          navigate(`/room/${clicked.name}`);
        }
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => gl.domElement.removeEventListener('click', handleClick);
  }, [gl, camera, navigate, scene]);

  // Hover pointer events
  const handlePointerOver = (e: any) => {
    const mesh: any = e.object as THREE.Mesh;
    if (mesh.name === "Box001_20_-_Defaultwe_0" || mesh.name === "Box001_20_-_Default_0") return;

    if (mesh.userData.interactive) {
      if (!originalMaterials.current.has(mesh)) {
        originalMaterials.current.set(mesh, mesh.material);
      }

      mesh.material = new THREE.MeshStandardMaterial({
        color: 'yellow',
        emissive: new THREE.Color(0xffff00),
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9,
      });

      // setHoveredMesh(mesh);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = (e: any) => {
    const mesh = e.object as THREE.Mesh;
    if (mesh.userData.interactive && originalMaterials.current.has(mesh)) {
      mesh.material = originalMaterials.current.get(mesh)!;
      originalMaterials.current.delete(mesh);
      // setHoveredMesh(null);
      document.body.style.cursor = 'default';
    }
  };

  // Setup mesh interactivity
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.interactive = true;
      }
    });
  }, [scene]);

  return (
    <primitive
      object={scene}
      scale={1.5}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  );
}
