import { Routes, Route } from 'react-router-dom';
import Lobby from "../screens/Lobby.jsx"
import RoomPage from "../screens/RoomPage.jsx"

function App() {
  return (
    <div className='min-h-screen w-full bg-[#0b0f19] text-slate-100 flex flex-col'>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </div>
  );
}

export default App;
