import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css"; // Import the CSS file
import { supabase } from "../utility/supabaseClient";
import { v4 as uuidv4 } from "uuid";

function Signup() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const { data: serviceStatus, error } = await supabase
          .from("AppConfig")
          .select("*");
        if (error) throw error;
        if (serviceStatus[0]?.isSignupActive === false) {
          navigate("/maintenance");
        }
      } catch (error) {
        console.error("Error checking service status:", error);
      }
    };
    checkServiceStatus();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    const { data: signupData, error: signupError } = await supabase.auth.signUp(
      { email, password }
    );
    if (signupError) {
      setMessage("Signup Error: " + signupError.message);
      return;
    }
    setMessage("Sign-up successful! Check your email.");

    await supabase.from("User").insert([
      {
        accountId: signupData?.user?.id,
        email,
        firstName,
        lastName,
        createdAt: signupData?.user?.created_at,
        updatedAt: new Date(),
        status: "ACTIVE",
        userType: "FREE",
      },
    ]);
    await supabase.from("FreeCoin").insert([
      {
        id: uuidv4(),
        accountId: signupData?.user?.id,
        amount: 1.0,
        updatedAt: new Date().toISOString(),
      },
    ]);

    await supabase.from("Wallet").insert([
      {
        id: uuidv4(),
        accountId: signupData?.user?.id,
        amount: 0.0,
        updatedAt: new Date().toISOString(),
      },
    ]);

    await supabase.from("Subscription").insert([
      {
        id: uuidv4(),
        accountId: signupData?.user?.id,
        createdAt: new Date().toISOString(),
        expiredAt: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="signup-container">
      <div className="logo" onClick={() => navigate("/")}>
        ECHO
      </div>
      <div className="signup-box">
        <h2>Sign up Here</h2>
        <form onSubmit={handleSignUp}>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            className="input-field"
          />
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
            className="input-field"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="input-field"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input-field"
          />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-type Password"
            className="input-field"
          />
          {message && <div className="error-message">{message}</div>}
          <button type="submit" className="signup-button">
            Sign Up
          </button>
        </form>
      </div>
      <div className="signup-login">
        <span>Already have an account? </span>
        <button
          onClick={() => navigate("/login")}
          className="signup-login-link"
        >
          Log In
        </button>
      </div>
    </div>
  );
}

export default Signup;
