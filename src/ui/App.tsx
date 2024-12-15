import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ApplicationUI from "./pages/ApplicationUI";
import OverlayUI from "./pages/OverlayUI";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ApplicationUI />} />
        <Route path="/overlay" element={<OverlayUI />} />
      </Routes>
    </Router>
  );
}

export default App;
