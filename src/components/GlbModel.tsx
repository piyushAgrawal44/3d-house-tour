import { useGLTF,} from '@react-three/drei';
import { useEffect, useRef,  } from 'react';
import { useThree, useFrame, } from '@react-three/fiber';
import * as THREE from 'three';
interface ModelSceneProps {
    setHoverInfo: React.Dispatch<React.SetStateAction<HoverInfo | null>>;
    setIsDialogOpen: any;
}

export interface HoverInfo {
    name: string;
    type: string;
    materialType: string;
    color: string;
    position: string;
    distance: string;
}

export function GlbModel({ setHoverInfo, setIsDialogOpen }: ModelSceneProps) {
    const { scene } = useGLTF('/models/suburban_house.glb') as { scene: THREE.Group };
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