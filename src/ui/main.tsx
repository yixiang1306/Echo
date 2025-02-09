import "regenerator-runtime/runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./utility/authprovider";
import "./main.css";
import ApplicationUI from "./pages/ApplicationUI";
import HiddenAudioPlayer from "./pages/HiddenAudioPlayer";
import Start from "./pages/Start";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Upgrade from "./pages/Upgrade";
import UpdateAcc from "./pages/UpdateAcc";
import Payment from "./pages/Payment";
import Settings from "./pages/Settings";
import ProtectedRoute from "./utility/protectedroute";
import ApplicationSideBarUI from "./pages/ApplicationSideBarUI";
import { LoadingProvider } from "./utility/loadingContext";
import PayPerUsePayment from "./pages/PayPerUsePayment";
import Feedback from "./pages/Feedback";

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
                <Route path="/overlay" element={<ApplicationSideBarUI />} />
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
