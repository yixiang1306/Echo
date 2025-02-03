import { HashRouter as Router, Routes, Route } from "react-router-dom";
import ApplicationUI from "./pages/ApplicationUI";
import OverlayUI from "./pages/OverlayUI";
import Start from "./pages/Start";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import HiddenAudioPlayer from "./pages/HiddenAudioPlayer";
import Settings from "./pages/Settings";
import UpdateAcc from "./pages/UpdateAcc";
import Upgrade from "./pages/Upgrade";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/application" element={<ApplicationUI />} />
        <Route path="/overlay" element={<OverlayUI />} />
        <Route path="/audio" element={<HiddenAudioPlayer />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/updateAcc" element={<UpdateAcc />} />
      </Routes>
    </Router>
  );
}

export default App;
