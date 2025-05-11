import { useGLTF } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';

export function RoomViewer({ modelPath }: { modelPath?: string }) {
  const { scene } = useGLTF(modelPath ?? '/models/modern_building.glb');
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const hoveredMeshRef = useRef<THREE.Object3D | null>(null);
  const originalMaterialRef = useRef<THREE.Material | null>(null);
  const { camera, gl } = useThree();
  const navigate = useNavigate();

  const highlightMaterial = new THREE.MeshStandardMaterial({
    color: '#4FC3F7',
    emissive: '#4FC3F7',
    transparent: true,
    opacity: 0.7,
  });

  useEffect(() => {
    console.log('modelpath', modelPath)
  }, [modelPath])

  // Handle mouse move to update raycaster coords
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      const { width, height, left, top } = gl.domElement.getBoundingClientRect();

      mouse.current.x = ((clientX - left) / width) * 2 - 1;
      mouse.current.y = -((clientY - top) / height) * 2 + 1;
    };

    gl.domElement.addEventListener('mousemove', handleMouseMove);
    return () => gl.domElement.removeEventListener('mousemove', handleMouseMove);
  }, [gl]);

  // 🖱 Handle click separately
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

    if (!modelPath) {
      gl.domElement.addEventListener('click', handleClick);
      return () => gl.domElement.removeEventListener('click', handleClick);

    }

  }, [gl, camera, navigate, scene]);

  // 👆 Hover logic (visual feedback)
  useFrame(() => {
    raycaster.current.setFromCamera(mouse.current, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    if (intersects.length === 0 || intersects[0].object !== hoveredMeshRef.current) {
      if (hoveredMeshRef.current && originalMaterialRef.current) {
        (hoveredMeshRef.current as any).material = originalMaterialRef.current;
        hoveredMeshRef.current = null;
        originalMaterialRef.current = null;
      }
    }

    if (intersects.length > 0 && !modelPath) {
      const hovered = intersects[0].object as THREE.Mesh;

      if (hovered !== hoveredMeshRef.current && hovered.isMesh) {
        hoveredMeshRef.current = hovered;
        originalMaterialRef.current = hovered.material as THREE.Material;
        hovered.material = highlightMaterial;

        console.log('Hovered on:', hovered.name || '(no name)');
      }
    }
  });

  return <primitive object={scene} scale={1.5} />;
}
