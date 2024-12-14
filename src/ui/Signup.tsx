import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="flex flex-col items-center justify-center bg-gray-900 text-white h-screen">
      {/* AskVox Link */}
      <div
        onClick={() => navigate("/")}
        className="cursor-pointer mb-8 text-4xl font-bold text-center"
      >
        <span className="text-blue-500">Ask</span>
        <span className="text-green-500">Vox</span>
      </div>

      <h1 className="text-3xl mb-4">Sign Up</h1>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="p-2 mb-4 rounded-lg"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="p-2 mb-4 rounded-lg"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="p-2 mb-4 rounded-lg"
      />
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm Password"
        className="p-2 mb-4 rounded-lg"
      />
      {errorMessage && <div className="text-red-500">{errorMessage}</div>}
      <button
        onClick={handleSignup}
        className="px-6 py-3 bg-green-500 rounded-lg hover:bg-green-700"
      >
        Sign Up
      </button>

      <div className="mt-4 text-sm text-gray-400">
        <span>Already have an account? </span>
        <button
          onClick={() => navigate("/login")}
          className="text-blue-500 hover:text-blue-700"
        >
          Log In
        </button>
      </div>
    </div>
  );
}

export default Signup;