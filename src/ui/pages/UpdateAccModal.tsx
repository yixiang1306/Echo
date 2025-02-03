import React from "react";
import { useTheme } from "../context/ThemeContext"; // Import the useTheme hook

interface UpdateAccModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const UpdateAccModal: React.FC<UpdateAccModalProps> = ({ onConfirm, onCancel }) => {
  const { isDarkMode } = useTheme(); // Get the current theme

  return (
    <div
      className={`fixed inset-0 ${
        isDarkMode ? "bg-black bg-opacity-70" : "bg-black bg-opacity-50"
      } flex items-center justify-center`}
    >
      <div
        className={`p-6 rounded-lg shadow-lg text-center ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
        }`}
      >
        <h2 className="text-2xl font-bold mb-4">Update Profile</h2>
        <p className={`mb-6 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Are you sure you want to update your profile?
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded ${
              isDarkMode
                ? "bg-indigo-700 hover:bg-indigo-800 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            Yes
          </button>
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-300 hover:bg-gray-400 text-black"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateAccModal;