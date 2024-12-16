import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ApplicationUI from "./pages/ApplicationUI";
import OverlayUI from "./pages/OverlayUI";
import Start from "./pages/Start";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import HiddenAudioPlayer from "./pages/HiddenAudioPlayer";

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
      </Routes>
    </Router>
  );
}

export default App;
