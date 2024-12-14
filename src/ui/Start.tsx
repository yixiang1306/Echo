import { useNavigate } from "react-router-dom";
import './Start.css'; // Import the CSS file

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
      <h1 className="start-title">Welcome to AskVox!</h1>
      <div className="space-y-4">
        <button
          onClick={handleLogin}
          className="start-button start-button-login"
        >
          Login
        </button>
        <button
          onClick={handleSignup}
          className="start-button start-button-signup"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}

export default Start;