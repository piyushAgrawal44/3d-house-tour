import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { RoomViewer } from "../components/RoomViewer";


const Room = () => {
    const params = useParams()
    const [modelPath, setModelPath] = useState("")
    useEffect(() => {
        console.log('params', params)
        // console.log('val', params?.roomID?.includes('Object025'))
        if (params?.roomID?.includes('Object025')) {
            setModelPath('/models/dining_room_kichen_baked.glb')
        }
        else if (params?.roomID?.includes('Object011')) {
            setModelPath('/models/jungle_room.glb')
        }
        else if (params?.roomID?.includes('Object024')) {
            setModelPath('/models/living_room.glb')
        }
    }, [params])
    return (
        <div className="canvas-container">
            {
                modelPath &&
                <Canvas camera={{ position: [0, 40, 50], fov: 60 }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={1} />
                    <Environment preset="city" />
                    <RoomViewer modelPath={modelPath} />
                    <OrbitControls />
                </Canvas>
            }

        </div>
    )
}

export default Room
