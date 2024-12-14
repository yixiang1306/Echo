import "regenerator-runtime/runtime";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./main.css";
import App from "./App.tsx";
import Start from "./Start.tsx";

function Main() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true); // Authenticate user
  };

  return (
    <StrictMode>
      {isAuthenticated ? <App /> : <Start onLogin={handleLogin} />}
    </StrictMode>
  );
}

createRoot(document.getElementById("root")!).render(<Main />);
