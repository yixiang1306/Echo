import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

    // Assuming there's an API for user authentication
    const isAuthenticated = await mockLogin(username, password);

    if (isAuthenticated) {
      navigate("/app"); // Redirect to the app page after successful login
    } else {
      setErrorMessage("Invalid credentials. Please try again.");
    }
  };

  // This is a mock login function; replace it with real login logic
  const mockLogin = (username: string, password: string) => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(username === "user123" && password === "password123"); // Example check
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

      <h1 className="text-3xl mb-4">Log In</h1>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="p-2 mb-4 rounded-lg"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="p-2 mb-4 rounded-lg"
      />
      {errorMessage && <div className="text-red-500">{errorMessage}</div>}
      <button
        onClick={handleLogin}
        className="px-6 py-3 bg-green-500 rounded-lg hover:bg-green-700"
      >
        Log In
      </button>

      <div className="mt-4 text-sm text-gray-400">
        <span>Don't have an account? </span>
        <button
          onClick={() => navigate("/signup")}
          className="text-blue-500 hover:text-blue-700"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}

export default Login;