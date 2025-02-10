import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

interface SettingsProps {
  clearChatHistory: () => void;
}

const Settings: React.FC<SettingsProps> = ({ clearChatHistory }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      {/* Close Button */}
      <div
        className="test-close-btn absolute top-5 right-5 text-3xl cursor-pointer text-gray-900 dark:text-gray-200"
        onClick={() => navigate("/app")}
      >
        &times;
      </div>

      {/* Overlay Container */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-6 py-10 text-center max-w-lg w-full">
        {/* Logo */}
        <div
          className="absolute top-5 left-10 text-2xl font-bold cursor-pointer"
          onClick={() => navigate("/app")}
        >
          <span className="text-black dark:text-white">Ask</span>
          <span className="text-indigo-500">Vox</span>
        </div>

        {/* Title */}
        <h1 className="test-setting-text text-lg font-bold mb-6 text-gray-900 dark:text-gray-200">
          Settings
        </h1>

        {/* Options */}
        <div className="flex flex-col items-center justify-center space-y-4 text-gray-700 dark:text-gray-300">
          <button
            className="test-update-acc-btn"
            onClick={() => navigate("/updateAcc")}
          >
            Profile Settings
          </button>
          <button
            className="test-feedback-btn"
            onClick={() => navigate("/feedback")}
          >
            Feedback
          </button>
          <button className="test-clear-History-btn" onClick={clearChatHistory}>
            Clear Chat History
          </button>
          <button
            onClick={toggleTheme}
            className="test-darkmode_btn mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg shadow-md"
          >
            {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
