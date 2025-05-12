import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, type Camera } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { RoomViewer } from "../components/RoomViewer";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/Addons.js";
import { CameraController } from "./CameraController";
import * as THREE from "three";


function AnimatedCircle({
    position,
    onClick,
}: {
    position: [number, number, number];
    onClick: () => void;
}) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        const mesh = meshRef.current;
        if (mesh) {
            const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
            mesh.scale.set(scale, scale, scale);
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={position}
            rotation={[-Math.PI / 2, 0, 0]}
            onDoubleClick={onClick}
        >
            <circleGeometry args={[8.5, 84]} />
            <meshStandardMaterial
                color="white"
                opacity={1}
                transparent
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

function CameraMover({
    cameraRef,
    targetPosition,
    setTargetPosition,
    controlsRef,
}: {
    cameraRef: React.RefObject<Camera | null>;
    targetPosition: [number, number, number] | null;
    setTargetPosition: React.Dispatch<React.SetStateAction<[number, number, number] | null>>;
    controlsRef: React.RefObject<ThreeOrbitControls | any>;
}) {
    useFrame((_, delta) => {
        
        if (targetPosition && cameraRef.current) {
            const cam = cameraRef.current;
            const current = cam.position.clone();
            const target = new THREE.Vector3(targetPosition[0], current.y, targetPosition[2]);

            // Disable OrbitControls while animating
            if (controlsRef.current) {
                controlsRef.current.enabled = false;
            }

            if (current.distanceTo(target) > 0.1) {
                cam.position.lerp(target, 1 - Math.pow(0.01, delta));

                cam.lookAt(new THREE.Vector3(targetPosition[0], current.y, targetPosition[2]));
            } else {
                setTargetPosition(null);

                // Re-enable OrbitControls when done
                if (controlsRef.current) {
                    controlsRef.current.enabled = true;
                }
            }
        }
    });

    return null;
}


const RoomTour = () => {
    const params = useParams();
    const [modelPath, setModelPath] = useState("");
    const [moveDirection, setMoveDirection] = useState("");
    const controlsRef = useRef<ThreeOrbitControls | any>(null);
    const cameraRef = useRef<Camera | null>(null);
    const [targetPosition, setTargetPosition] = useState<[number, number, number] | null>(null);

    useEffect(() => {
       setModelPath("/models/jungle_room.glb");
    }, [params]);

    const stopMoving = () => setMoveDirection("");

    // ✅ Floor circles
    const circlePositions: [number, number, number][] = [
        [-85, 22, -5],
        [-80, 2, -55],
        [105, 2, 5],
        
    ];

    

    return (
        <div className="canvas-container" style={{ height: "100vh", position: "relative" }}>
            {modelPath && (
                <Canvas
                    camera={{ position: [90, 2, 80], fov: 50 }}
                    onCreated={({ camera }) => (cameraRef.current = camera)}
                >
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={1} />
                    <Environment preset="city" />
                    <RoomViewer modelPath={modelPath} />

                    <CameraMover
                        cameraRef={cameraRef}
                        targetPosition={targetPosition}
                        setTargetPosition={setTargetPosition}
                        controlsRef={controlsRef}
                    />

                    {/* ✅ Circles (bigger, black, floor level, visible both sides) */}
                    {circlePositions.map((pos, idx) => (
                        <AnimatedCircle
                            key={idx}
                            position={pos}
                            onClick={() => setTargetPosition([pos[0], pos[1] + 4, pos[2] - 6])}
                        />
                    ))}



                    <OrbitControls ref={controlsRef} />
                    <CameraController direction={moveDirection} controlsRef={controlsRef} />
                </Canvas>
            )}

            {/* ✅ Navigation buttons */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-10">
                <button
                    onMouseDown={() => setMoveDirection("forward")}
                    onMouseUp={stopMoving}
                    className="bg-white text-gray-900 px-5 py-3 rounded-lg text-base hover:bg-blue-500 transition"
                >
                    🔼 Forward
                </button>
                <button
                    onMouseDown={() => setMoveDirection("backward")}
                    onMouseUp={stopMoving}
                    className="bg-white text-gray-900 px-5 py-3 rounded-lg text-base hover:bg-blue-500 transition"
                >
                    🔽 Backward
                </button>
            </div>
        </div>
    );
};

export default RoomTour;
