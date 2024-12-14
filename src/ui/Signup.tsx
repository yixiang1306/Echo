import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css"; // Import the CSS file

function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignup = async () => {
    if (!username || !email || !password || !confirmPassword) {
      setErrorMessage("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage("Invalid email format.");
      return;
    }

    const isSignedUp = await mockSignup(username, email, password);

    if (isSignedUp) {
      navigate("/login"); // Redirect to login page after successful signup
    } else {
      setErrorMessage("Error during signup. Please try again.");
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const mockSignup = (username: string, email: string, password: string) => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(username !== "existingUser");
      }, 1000);
    });
  };

  return (
    <div className="signup-container">
      {/* Header */}
      <div className="logo" onClick={() => navigate("/")}>
        <span className="ask">Ask</span>
        <span className="vox">Vox</span>
      </div>

      <div className="signup-box">
        <h2><b>Sign up Here</b></h2>

        {/* Input Fields */}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="input-field"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input-field"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input-field"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-type Password"
          className="input-field"
        />

        {/* Error Message */}
        {errorMessage && <div className="error-message">{errorMessage}</div>}

        {/* Button */}
        <button onClick={handleSignup} className="signup-button">
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
