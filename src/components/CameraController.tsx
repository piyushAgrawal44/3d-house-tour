import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Move camera in the direction it's looking based on OrbitControls target
export const CameraController = ({ direction, controlsRef }: any) => {
    const { camera } = useThree();

    useFrame(() => {
        if (!direction || !controlsRef.current) return;

        const dir = new THREE.Vector3();
        dir.subVectors(controlsRef.current.target, camera.position).normalize();

        const speed = 1;

        if (direction === "forward") {
            camera.position.add(dir.clone().multiplyScalar(speed));
            controlsRef.current.target.add(dir.clone().multiplyScalar(speed));
        } else if (direction === "backward") {
            camera.position.add(dir.clone().multiplyScalar(-speed));
            controlsRef.current.target.add(dir.clone().multiplyScalar(-speed));
        }
    });

    return null;
};