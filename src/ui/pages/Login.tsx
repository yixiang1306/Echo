import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Import the external CSS file
import { supabase } from "../supabaseClient";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState<string>("");

  // const handleLogin = async () => {
  //   if (!email || !password) {
  //     setMessage("Both fields are required.");
  //     return;
  //   }

  //   const isAuthenticated = await mockLogin(email, password);

  //   if (isAuthenticated) {
  //     navigate("/application"); // Redirect to the app page after successful login
  //   } else {
  //     setMessage("Invalid credentials. Please try again.");
  //   }
  // };

  // const mockLogin = (email: string, password: string) => {
  //   return new Promise<boolean>((resolve) => {
  //     setTimeout(() => {
  //       resolve(email === "u" && password === "p");
  //     }, 1000);
  //   });
  // };

  const handleSignIn = async (e: React.FormEvent) => {
    // e.preventDefault();
    // const { data, error } = await supabase.auth.signInWithPassword({
    //   email,
    //   password,
    // });
    // setMessage(error ? error.message : "Login successful!");
    // if (error === null) {
    //   localStorage.setItem("accountId", data.user.id || "");
    //   navigate("/application");
    // }
    navigate("/application");
  };

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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          className="input-field"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input-field"
        />
        {message && <div className="error-message">{message}</div>}
        <button onClick={handleSignIn} className="login-button">
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
