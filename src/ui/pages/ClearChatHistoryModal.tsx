import React from "react";
import { useTheme } from "../context/ThemeContext"; // Import the useTheme hook

interface ClearChatHistoryModalProps {
  onConfirm: () => void; // Function to confirm clearing chat history
  onCancel: () => void; // Function to cancel the action
}

const ClearChatHistoryModal: React.FC<ClearChatHistoryModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  const { isDarkMode } = useTheme(); // Access the theme context

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      {/* Modal Container */}
      <div
        className={`${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
        } p-6 rounded-lg shadow-lg text-center`}
      >
        {/* Title */}
        <h2
          className={`text-2xl font-bold mb-4 ${
            isDarkMode ? "text-red-400" : "text-red-600"
          }`}
        >
          Clear Chat History
        </h2>
        {/* Description */}
        <p className="mb-6">
          Are you sure you want to clear your entire chat history? This action
          cannot be undone.
        </p>
        {/* Buttons */}
        <div className="flex justify-center gap-4">
          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded hover:${
              isDarkMode ? "bg-red-700" : "bg-red-700"
            } ${
              isDarkMode ? "bg-red-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            Yes, Clear
          </button>
          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded hover:${
              isDarkMode ? "bg-gray-600" : "bg-gray-400"
            } ${
              isDarkMode ? "bg-gray-500 text-white" : "bg-gray-300 text-black"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearChatHistoryModal;