import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext"; // Import the useTheme hook

const Upgrade: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme(); // Get the current theme

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      } p-4`}
    >
      {/* Logo */}
      <div
        className="absolute top-5 left-10 cursor-pointer text-4xl font-bold mb-5"
        onClick={() => navigate("/app")}
      >
        <span className={isDarkMode ? "text-indigo-400" : "text-black"}>Ask</span>
        <span className="text-indigo-500">Vox</span>
      </div>

      {/* Header */}
      <h1 className="text-3xl font-bold mb-8 text-center">
        Choose your plan
      </h1>

      {/* Plans Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {/* Free Plan */}
        <div
          className={`border rounded-lg shadow-md text-center p-6 ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <h2 className="text-xl font-bold mb-2">Free</h2>
          <p className="text-3xl font-bold">
            $0<span className="text-sm font-normal">/month</span>
          </p>
          <button
            className={`mt-6 py-2 px-6 rounded-full ${
              isDarkMode
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-600 cursor-not-allowed"
            }`}
            disabled
          >
            Current
          </button>
        </div>

        {/* Premium Plan */}
        <div
          className={`border rounded-lg shadow-md text-center p-6 ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <h2 className="text-xl font-bold mb-2">Premium</h2>
          <p className="text-3xl font-bold">
            $10<span className="text-sm font-normal">/month</span>
          </p>
          <button
            className={`mt-6 py-2 px-6 rounded-full ${
              isDarkMode
                ? "bg-indigo-700 hover:bg-indigo-800 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
            onClick={() => navigate("/payment")}
          >
            Upgrade to Premium
          </button>
        </div>

        {/* One-Time Purchase */}
        <div
          className={`border rounded-lg shadow-md text-center p-6 ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <h2 className="text-xl font-bold mb-2">One-Time Purchase</h2>
          <p className="text-3xl font-bold">
            $1<span className="text-sm font-normal">/10 tokens</span>
          </p>
          <button
            className={`mt-6 py-2 px-6 rounded-full ${
              isDarkMode
                ? "bg-teal-700 hover:bg-teal-800 text-white"
                : "bg-teal-500 hover:bg-teal-600 text-white"
            }`}
          >
            Buy Tokens
          </button>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;