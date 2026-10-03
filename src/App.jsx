import { Routes, Route } from 'react-router-dom';
import RoomPage from "../screens/RoomPage.jsx"
import LobbyPage from '../screens/LobbyPage.jsx';

function App() {
  return (
    <div className='min-h-screen w-full bg-[#0b0f19] text-slate-100 flex flex-col'>
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </div>
  );
}

export default App;
