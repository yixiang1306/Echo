import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./main.css";
import ApplicationUI from "./pages/ApplicationUI";
import Start from "./pages/Start";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Upgrade from "./pages/Upgrade";
import Settings from "./pages/Settings";
import UpdateAcc from "./pages/UpdateAcc";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/app" element={<ApplicationUI />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/updateAcc" element={<UpdateAcc />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
