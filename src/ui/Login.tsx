import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './Login.css'; // Import the CSS file

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMessage("Both fields are required.");
      return;
    }

    // Assuming there's an API for user authentication
    const isAuthenticated = await mockLogin(username, password);

    if (isAuthenticated) {
      navigate("/app"); // Redirect to the app page after successful login
    } else {
      setErrorMessage("Invalid credentials. Please try again.");
    }
  };

  // This is a mock login function; replace it with real login logic
  const mockLogin = (username: string, password: string) => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(username === "user123" && password === "password123"); // Example check
      }, 1000);
    });
  };

  return (
    <div className="login-container">
      {/* AskVox Link */}
      <div
        onClick={() => navigate("/")}
        className="askvox-link"
      >
        <span className="askvox-text-ask">Ask</span>
        <span className="askvox-text-vox">Vox</span>
      </div>

      <h1 className="login-title">Log In</h1>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="login-input"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="login-input"
      />
      {errorMessage && <div className="login-error">{errorMessage}</div>}
      <button
        onClick={handleLogin}
        className="login-button"
      >
        Log In
      </button>

      <div className="login-signup">
        <span>Don't have an account? </span>
        <button
          onClick={() => navigate("/signup")}
          className="login-signup-link"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}

export default Login;