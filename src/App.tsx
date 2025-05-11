
import { Route, Routes } from 'react-router-dom';
import './App.css';
import ModelViewer from './components/ModelViewer';
import RoomTour from './components/RoomTour';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>

      <Routes>
        <Route path='' element={<ModelViewer />} />
        <Route path='/room/:roomID' element={<RoomTour />} />
      </Routes>

    </div>
  );
}
