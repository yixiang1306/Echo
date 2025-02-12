import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { X } from "lucide-react";

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-gray-100 dark:bg-primary text-gray-900 dark:text-white flex items-center justify-center transition-all duration-300">
      {/* Logo */}
      <div
        className="absolute top-5 left-10 text-2xl font-bold cursor-pointer drop-shadow-[0_0_10px_rgba(0,150,255,0.8)]"
        onClick={() => navigate("/app")}
      >
        <h1 className="dark:text-white text-gray-900 text-3xl">ECHO</h1>
      </div>

      {/* Close Button */}
      <div
        className="absolute top-5 right-5 text-3xl cursor-pointer text-gray-900 dark:text-gray-300 hover:text-red-500 transition duration-300"
        onClick={() => navigate("/app")}
      >
        <X className="size-10" />
      </div>

      {/* Main Container */}
      <div className="relative flex flex-col items-center text-center bg-white dark:bg-secondary p-12 rounded-3xl shadow-xl backdrop-blur-md border border-gray-300 dark:border-gray-700 transition-all duration-300">
        {/* Glowing Border Effect */}
        <div className="absolute inset-0 border-[2px] border-blue-500/40 rounded-3xl blur-sm pointer-events-none shadow-[0_0_20px_rgba(0,150,255,0.4)]"></div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking text-gray-900 dark:text-white drop-shadow-[0_0_15px_rgba(0,150,255,0.8)]">
          Settings
        </h1>

        {/* Options */}
        <div className="mt-8 flex flex-col items-center w-full space-y-5">
          <button
            className="w-64 px-6 py-3 rounded-lg text-lg font-semibold border border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-300 bg-gray-200 dark:bg-transparent
            hover:bg-gray-300 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition duration-300 shadow-lg shadow-blue-500/30"
            onClick={() => navigate("/updateAcc")}
          >
            Profile Settings
          </button>
          <button
            className="w-64 px-6 py-3 rounded-lg text-lg font-semibold border border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-300 bg-gray-200 dark:bg-transparent
            hover:bg-gray-300 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition duration-300 shadow-lg shadow-purple-500/30"
            onClick={() => navigate("/feedback")}
          >
            Feedback
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="w-64 px-6 py-3 rounded-lg text-lg font-semibold border border-indigo-400 dark:border-indigo-500 text-gray-900 dark:text-gray-300 bg-gray-200 dark:bg-transparent
            hover:bg-gray-300 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition duration-300 shadow-lg shadow-indigo-500/30"
          >
            {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
