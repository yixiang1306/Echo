import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css"; // Import the CSS file
import { supabase } from "../utility/supabaseClient";
import { v4 as uuidv4 } from "uuid";

function Signup() {
  const navigate = useNavigate();
  const [fistname, setFistname] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: signupData, error: signupError } = await supabase.auth.signUp(
      {
        email,
        password,
      }
    );
    setMessage(
      signupError
        ? "signuperror " + signupError.message
        : "Sign-up successful! Check your email."
    );

    await supabase
      .from("User")
      .insert([
        {
          accountId: signupData?.user?.id,
          email: email,
          firstName: fistname,
          lastName: lastName,
          createdAt: signupData?.user?.created_at,
          updatedAt: new Date(),
          status: "ACTIVE",
          userType: "FREE",
        },
      ])
      .select();

    await supabase
      .from("FreeCoin")
      .insert([
        {
          id: uuidv4(), // Unique ID for each record
          accountId: signupData?.user?.id,
          amount: 1.0,
          updatedAt: new Date().toISOString(),
        },
      ])
      .select();
    await supabase
      .from("Wallet")
      .insert([
        {
          id: uuidv4(), // Unique ID for each record
          accountId: signupData?.user?.id,
          amount: 0.0,
          updatedAt: new Date().toISOString(),
        },
      ])
      .select();
    await supabase
      .from("Subscription")
      .insert([
        {
          id: uuidv4(), // Unique ID for each record
          accountId: signupData?.user?.id,
          createdAt: new Date().toISOString(),
          expiredAt: new Date().toISOString(),
        },
      ])
      .select();
  };

  return (
    <div className="signup-container">
      {/* Header */}
      <div className="logo" onClick={() => navigate("/")}>
        <span className="ask">Ask</span>
        <span className="vox">Vox</span>
      </div>

      <div className="signup-box">
        <h2>
          <b>Sign up Here</b>
        </h2>

        {/* Input Fields */}
        <input
          type="text"
          required
          value={fistname}
          onChange={(e) => setFistname(e.target.value)}
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

        {/* Error Message */}
        {message && <div className="error-message">{message}</div>}

        {/* Button */}
        <button onClick={handleSignUp} className="signup-button">
          Sign Up
        </button>
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
