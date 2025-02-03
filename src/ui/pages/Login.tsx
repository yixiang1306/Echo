import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Import the external CSS file
import { supabase } from "../supabase";

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

    const isAuthenticated = await mockLogin(username, password);

    if (isAuthenticated) {
      navigate("/app"); // Redirect to the app page after successful login
    } else {
      setErrorMessage("Invalid credentials. Please try again.");
    }
  };

  const mockLogin = (username: string, password: string) => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(username === "u" && password === "p");
      }, 1000);
    });
  };

  // For testing 
  /*
  async function test() {
    const { data, error } = await supabase.from("User").select("*");

    if (error) {
      console.log("Error fetching data:", error);
    }

    console.log("Data:", data);
  }

  useEffect(() => {
    test();
  }, []); */

  return (
    <div className="login-container">
      {/* Header */}
      <div className="logo" onClick={() => navigate("/")}>
        <span className="ask">Ask</span>
        <span className="vox">Vox</span>
      </div>

      {/* Login Card */}
      <div className="login-card">
        <h1 className="login-title">Login Here</h1>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="input-field"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input-field"
        />
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <button onClick={handleLogin} className="login-button">
          Login
        </button>
        <div className="divider">
          <span>------------ Or ------------</span>
        </div>
        <button onClick={() => navigate("/signup")} className="signup-button">
          Sign Up
        </button>
      </div>
    </div>
  );
}

export default Login;
