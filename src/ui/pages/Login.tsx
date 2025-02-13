import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utility/supabaseClient";

import {
  markUserAsOnline,
  syncCoinsAndSubscriptions,
} from "../utility/syncFunctions";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage("Error signing in: " + error.message);
        setIsProcessing(false);
        return;
      }

      navigate("/app");
    } catch (error) {
      console.error("Login error:", error);
      setMessage("An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="login-container">
      <div className="logo" onClick={() => navigate("/")}>
        <h1>ECHO</h1>
      </div>

      <div className="login-card">
        <h1 className="login-title">Welcome Back</h1>

        {/* Updated: Use a form element for proper structure */}
        <form onSubmit={handleSignIn} className="login-form">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="input-field"
            disabled={isProcessing}
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="input-field"
            disabled={isProcessing}
          />
          {message && <div className="error-message">{message}</div>}

          {/* Use type="submit" to handle form submission */}
          <button
            type="submit"
            className="login-button"
            disabled={isProcessing}
          >
            {isProcessing ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="divider">Or continue with</div>
        <button onClick={() => navigate("/signup")} className="signup-button">
          Sign Up
        </button>
      </div>
    </div>
  );
}

export default Login;
