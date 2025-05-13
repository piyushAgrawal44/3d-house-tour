import { useLoader, useFrame, useThree } from '@react-three/fiber';
import { FBXLoader } from 'three-stdlib';
import * as THREE from 'three';
import { useEffect, useRef } from 'react';

export default function FBXModel({ path, setHoverInfo, scale, setIsDialogOpen }: { path: string, setHoverInfo: any, scale: number, setIsDialogOpen: any }) {
    const fbx = useLoader(FBXLoader, path);
    const groupRef = useRef<THREE.Group>(null);
    const raycaster = useRef(new THREE.Raycaster());
    const mouse = useRef(new THREE.Vector2());
    const hoveredMeshRef = useRef<THREE.Mesh | null>(null);
    const { camera, gl } = useThree();

    const highlightMaterial = new THREE.MeshStandardMaterial({
        color: '#4FC3F7',
        emissive: '#4FC3F7',
        transparent: true,
        opacity: 0.7,
    });
    const handleDoubleClick = (event: MouseEvent) => {
        const { clientX, clientY } = event;
        const { width, height, left, top } = gl.domElement.getBoundingClientRect();

        mouse.current.x = ((clientX - left) / width) * 2 - 1;
        mouse.current.y = -((clientY - top) / height) * 2 + 1;

        raycaster.current.setFromCamera(mouse.current, camera);
        if (!groupRef.current) return;
        const intersects = raycaster.current.intersectObjects(groupRef.current.children, true);


        if (intersects.length > 0) {
            console.log("first", intersects);
            setIsDialogOpen(true);
        }
    };

    useEffect(() => {
        fbx.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        const handleMouseMove = (event: MouseEvent) => {
            const rect = gl.domElement.getBoundingClientRect();
            mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        };
        gl.domElement.addEventListener('dblclick', handleDoubleClick);
        gl.domElement.addEventListener('mousemove', handleMouseMove);
        return () => {
            gl.domElement.addEventListener('dblclick', handleDoubleClick);
            gl.domElement.removeEventListener('mousemove', handleMouseMove)
        };
    }, [fbx]);

    useFrame(() => {
        if (!groupRef.current) return;
        raycaster.current.setFromCamera(mouse.current, camera);
        const intersects = raycaster.current.intersectObjects(groupRef.current.children, true);

        if (intersects.length > 0) {
            const mesh: any = intersects[0].object as THREE.Mesh;
            if (mesh !== hoveredMeshRef.current) {
                if (hoveredMeshRef.current) {
                    hoveredMeshRef.current.material = hoveredMeshRef.current.userData.originalMaterial;
                }
                hoveredMeshRef.current = mesh;
                mesh.userData.originalMaterial = mesh.material;
                mesh.material = highlightMaterial;

                setHoverInfo({
                    name: mesh.name || 'Unnamed',
                    type: mesh.type,
                    materialType: mesh.material.type,
                    color: mesh.material.color ? `#${mesh.material.color.getHexString()}` : 'N/A',
                    position: `X: ${mesh.position.x.toFixed(2)}, Y: ${mesh.position.y.toFixed(2)}, Z: ${mesh.position.z.toFixed(2)}`,
                    distance: intersects[0].distance.toFixed(2),
                });
            }
        } else {
            if (hoveredMeshRef.current) {
                hoveredMeshRef.current.material = hoveredMeshRef.current.userData.originalMaterial;
                hoveredMeshRef.current = null;
                setHoverInfo(null);
            }
        }
    });

    return <primitive ref={groupRef} object={fbx} scale={scale} />;
}
