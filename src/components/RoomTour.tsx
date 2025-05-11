import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

// Mock data for room panoramas - in a real app, you'd use your actual image URLs
const rooms = [
    {
        id: 'main-bedroom',
        name: 'Coral Bedroom',
        imageUrl: '/room/room1.jpg', // Replace with actual image path
        hotspots: [
            {
                id: 'to-bathroom',
                position: new THREE.Vector3(5, 0, -5),
                label: 'Bathroom',
                targetRoom: 'bathroom'
            },
            {
                id: 'to-hallway',
                position: new THREE.Vector3(-5, 0, -5),
                label: 'Corridor',
                targetRoom: 'hallway'
            }
        ]
    },
    {
        id: 'bathroom',
        name: 'Bathroom',
        imageUrl: '/room/bathroom1.jpg', // Replace with actual image path
        hotspots: [
            {
                id: 'to-bedroom',
                position: new THREE.Vector3(0, 0, 5),
                label: 'Back to Bedroom',
                targetRoom: 'main-bedroom'
            }
        ]
    },
    {
        id: 'hallway',
        name: 'Corridor',
        imageUrl: '/room/corridor.jpg', // Replace with actual image path
        hotspots: [
            {
                id: 'to-bedroom',
                position: new THREE.Vector3(5, 0, 0),
                label: 'Back to Bedroom',
                targetRoom: 'main-bedroom'
            }
        ]
    }
];

function PanoramaViewer() {
    const [currentRoom, setCurrentRoom] = useState(rooms[0]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFading, setIsFading] = useState(false);
    const canvasRef = useRef<any>(null);
    const sceneRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const rendererRef = useRef<any>(null);
    const textureRef = useRef<any>(null);
    const controlsRef = useRef<any>(null);

    // Initialize the Three.js scene
    useEffect(() => {
        if (!canvasRef.current) return;

        // Create scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Create camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 0.1);
        cameraRef.current = camera;

        // Create renderer
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        rendererRef.current = renderer;

        // Create controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.rotateSpeed = -0.5;
        controlsRef.current = controls;


        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            if (controlsRef.current) controlsRef.current.update();
            renderer.render(scene, camera);
        };

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
        };
    }, []);

    // Load panoramic image when room changes
    useEffect(() => {
        if (!sceneRef.current || !currentRoom) return;

        setIsLoading(true);
        setIsFading(true);

        // Create a new panoramic texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            currentRoom.imageUrl,
            (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;

                // Fade in the new texture
                setTimeout(() => {
                    if (textureRef.current) {
                        // Dispose of old texture
                        textureRef.current.dispose();
                    }

                    textureRef.current = texture;
                    sceneRef.current.background = texture;
                    setIsLoading(false);

                    setTimeout(() => {
                        setIsFading(false);
                    }, 500);
                }, 500);
            },
            undefined,
            (error) => {
                console.error('Error loading texture:', error);
                setIsLoading(false);
                setIsFading(false);
            }
        );
    }, [currentRoom]);

    // Handle room change
    const handleRoomChange = (roomId:any) => {
        const newRoom = rooms.find(room => room.id === roomId);
        if (newRoom) {
            setCurrentRoom(newRoom);
        }
    };

    return (
        <div className="relative w-full h-full">
            <canvas ref={canvasRef} className="w-full h-full" />

            {/* Fade overlay */}
            <div className={`absolute inset-0 bg-black transition-opacity duration-500 ${isFading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}></div>

            {/* Room name */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
                {currentRoom.name}
            </div>

            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black bg-opacity-70 text-white px-6 py-3 rounded-lg">
                        Loading...
                    </div>
                </div>
            )}

            {/* Hotspots */}
            {!isLoading && !isFading && (
                <div className="absolute inset-0 pointer-events-none">
                    {currentRoom.hotspots.map((hotspot) => (
                        <button
                            key={hotspot.id}
                            className="absolute bg-white text-black px-3 py-1 rounded shadow hover:bg-blue-200 transition-colors pointer-events-auto"
                            style={{
                                left: `${(hotspot.position.x + 10) / 20 * 100}%`,
                                top: `${(-hotspot.position.y + 10) / 20 * 100}%`,
                            }}
                            onClick={() => handleRoomChange(hotspot.targetRoom)}
                        >
                            {hotspot.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded">
                Drag to look around • Click hotspots to navigate
            </div>
        </div>
    );
}

function RoomTour() {
    return (
        <div className="w-screen h-screen bg-gray-900">
            <PanoramaViewer />
        </div>
    );
}

export default RoomTour;