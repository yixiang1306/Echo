import { useNavigate } from "react-router-dom";

function Start() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  const handleSignup = () => {
    navigate("/signup");
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-900 text-white h-screen">
      <h1 className="text-3xl mb-4">Welcome to AskVox!</h1>
      <div className="space-y-4">
        <button
          onClick={handleLogin}
          className="px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-700"
        >
          Login
        </button>
        <button
          onClick={handleSignup}
          className="px-6 py-3 bg-green-500 rounded-lg hover:bg-green-700"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}

export default Start;




