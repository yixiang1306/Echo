import React from "react";
import { useTheme } from "../context/ThemeContext"; // Import the useTheme hook

interface LogoutModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ onConfirm, onCancel }) => {
  const { isDarkMode } = useTheme(); // Get the current theme

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: isDarkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: isDarkMode ? "#1f2937" : "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          width: "300px",
          textAlign: "center",
          color: isDarkMode ? "white" : "black",
        }}
      >
        <h2 style={{ margin: 0 }}>Are you sure you want to log out?</h2>
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <button
            style={{
              padding: "8px 16px",
              cursor: "pointer",
              border: "none",
              borderRadius: "4px",
              backgroundColor: "#4b5563",
              color: "white",
            }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            style={{
              padding: "8px 16px",
              cursor: "pointer",
              border: "none",
              borderRadius: "4px",
              backgroundColor: isDarkMode ? "#10b981" : "#28a745",
              color: "white",
            }}
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;