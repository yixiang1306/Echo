import "regenerator-runtime/runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./utility/authprovider";

import "./main.css";
import ApplicationUI from "./pages/ApplicationUI";
import OverlayUI from "./pages/OverlayUI";
import HiddenAudioPlayer from "./pages/HiddenAudioPlayer";
import Start from "./pages/Start";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Upgrade from "./pages/Upgrade";
import UpdateAcc from "./pages/UpdateAcc";
import Payment from "./pages/Payment";
import Settings from "./pages/Settings";
import ProtectedRoute from "./utility/protectedroute";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <HashRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Start />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<ApplicationUI />} />
              <Route path="/overlay" element={<OverlayUI />} />
              <Route path="/audio" element={<HiddenAudioPlayer />} />
              <Route path="/upgrade" element={<Upgrade />} />
              <Route path="/settings" element={<Settings/>}/>
              <Route path="/updateAcc" element={<UpdateAcc />} />
              <Route path="/payment" element={<Payment />} />
            </Route>
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </HashRouter>
    </ThemeProvider>
  </StrictMode>
);
