import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import ClearChatHistoryModal from "./ClearChatHistoryModal";
import { clearChatHistory as clearChatHistoryUtility } from "./chatUtils";

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isClearChatModalVisible, setIsClearChatModalVisible] = useState(false);

  // Retrieve userId from navigation state
  const userId = location.state?.userId;

  // Redirect if userId is missing
  useEffect(() => {
    if (!userId) {
      console.warn("User ID is missing. Redirecting to the main app.");
      navigate("/app");
    }
  }, [userId, navigate]);

  const handleConfirmClearChatHistory = async () => {
    if (!userId) {
      console.error("User ID is not available.");
      return;
    }
    try {
      await clearChatHistoryUtility(userId); // Call the utility function
      setIsClearChatModalVisible(false); // Hide the modal
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  };

  const handleCancelClearChatHistory = () => {
    setIsClearChatModalVisible(false); // Hide the modal
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      {/* Close Button */}
      <div
        className="absolute top-5 right-5 text-3xl cursor-pointer text-gray-900 dark:text-gray-200"
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
        <h1 className="text-lg font-bold mb-6 text-gray-900 dark:text-gray-200">
          Settings
        </h1>
        {/* Options */}
        <div className="flex flex-col items-center justify-center space-y-4 text-gray-700 dark:text-gray-300">
          <button onClick={() => navigate("/updateAcc")}>Profile Settings</button>
          <button onClick={() => setIsClearChatModalVisible(true)}>Clear Chat History</button>
          <button
            onClick={toggleTheme}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg shadow-md"
          >
            {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>
        </div>
      </div>
      {/* Clear Chat History Modal */}
      {isClearChatModalVisible && (
        <ClearChatHistoryModal
          onConfirm={handleConfirmClearChatHistory}
          onCancel={handleCancelClearChatHistory}
        />
      )}
    </div>
  );
};

export default Settings;