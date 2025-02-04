import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utility/supabaseClient";

import {
  markUserAsOnline,
  syncCoinsAndSubscriptions,
} from "../utility/syncFunctions";
import "./Login.css";
import { useAuth } from "../utility/authprovider";

function Login() {
  const navigate = useNavigate();
  const { session, loading } = useAuth(); // Get session & loading state from AuthProvider
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState(""); // For error or info messages
  const [isProcessing, setIsProcessing] = useState(false); // Prevent multiple clicks

  //  Redirect if the user is already logged in
  useEffect(() => {
    if (!loading && session) {
      navigate("/app");
    }
  }, [session, loading, navigate]);

  //----------------------- Handle sign-in form submission---------------------------------
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return; // Prevent duplicate clicks
    setIsProcessing(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage("Error signing in: " + error.message);
        setIsProcessing(false);
        return;
      }

      console.log("✅ User signed in:", data);

      const userId = data.user.id;

      // 🔹 Mark user as online
      const isMarkedOnline = await markUserAsOnline(userId);
      if (!isMarkedOnline) {
        setMessage("Failed to mark user as online.");
        setIsProcessing(false);
        return;
      }

      // 🔹 Sync coins and subscriptions
      const isSynced = await syncCoinsAndSubscriptions(userId);
      if (!isSynced) {
        setMessage("Failed to sync user data.");
        setIsProcessing(false);
        return;
      }

      //  Redirect to app
      navigate("/app");
    } catch (error) {
      console.error("Login error:", error);
      setMessage(" An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="login-container">
      <div className="logo" onClick={() => navigate("/")}>
        <span className="ask">Ask</span>
        <span className="vox">Vox</span>
      </div>

      <div className="login-card">
        <h1 className="login-title">Login Here</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input-field"
          disabled={isProcessing}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input-field"
          disabled={isProcessing}
        />
        {message && <div className="error-message">{message}</div>}{" "}
        {/* Show error message if any */}
        <button
          onClick={handleSignIn}
          className="login-button"
          disabled={isProcessing}
        >
          {isProcessing ? "Logging in..." : "Login"}
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
