import { useNavigate } from "react-router-dom";
import "./Start.css"; // Import the CSS file

function Start() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  const handleSignup = () => {
    navigate("/signup");
  };

  return (
    <div className="start-container">
      {/* Main Circle */}
      <div className="circle">
        {/* Header */}
        <div className="header">
          <span className="ask">Ask</span>
          <span className="vox">Vox</span>
        </div>
        <p className="subtitle">Ask about anything</p>

        {/* Microphone Icon */}
        <div className="icon">
          <img src="./mic.png" alt="microphone" className="mic-icon" />
        </div>

        {/* Buttons */}
        <div className="button-group">
          <button className="btn login-btn" onClick={handleLogin}>
            Login
          </button>
          <button className="btn signup-btn" onClick={handleSignup}>
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default Start;
