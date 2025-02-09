import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import "regenerator-runtime/runtime";
import { ThemeProvider } from "./context/ThemeContext";
import "./main.css";
import ApplicationSideBarUI from "./pages/ApplicationSideBarUI";
import ApplicationUI from "./pages/ApplicationUI";
import Feedback from "./pages/Feedback";
import OverlayUI from "./pages/OverlayUI";
import HiddenAudioPlayer from "./pages/HiddenAudioPlayer";
import Login from "./pages/Login";
import Payment from "./pages/Payment";
import PayPerUsePayment from "./pages/PayPerUsePayment";
import Settings from "./pages/Settings";
import Signup from "./pages/Signup";
import Start from "./pages/Start";
import UpdateAcc from "./pages/UpdateAcc";
import Upgrade from "./pages/Upgrade";
import { AuthProvider } from "./utility/authprovider";
import ProtectedRoute from "./utility/protectedroute";
import { LoadingProvider } from "./utility/loadingContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <HashRouter>
        <LoadingProvider>
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
                <Route path="/sidebar" element={<ApplicationSideBarUI />} />
                <Route path="/audio" element={<HiddenAudioPlayer />} />
                <Route path="/upgrade" element={<Upgrade />} />
                <Route
                  path="/settings"
                  element={<Settings clearChatHistory={() => {}} />}
                />
                <Route path="/updateAcc" element={<UpdateAcc />} />
                <Route path="/payment" element={<Payment />} />
                <Route
                  path="/pay_per_use_payment"
                  element={<PayPerUsePayment />}
                />
                <Route path="/feedback" element={<Feedback />} />
              </Route>
            </Routes>
          </AuthProvider>
        </LoadingProvider>
      </HashRouter>
    </ThemeProvider>
  </StrictMode>
);
