import { useNavigate } from "react-router-dom";

const Settings: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-gray-100 flex items-center justify-center">
      {/* Close Button */}
      <div
        className="absolute top-5 right-5 text-3xl cursor-pointer"
        onClick={() => navigate("/app")}
      >
        &times;
      </div>

      {/* Overlay Container */}
      <div className="bg-white shadow-lg rounded-lg px-6 py-10 text-center max-w-lg w-full">
        {/* Logo */}
        <div
          className="absolute top-5 left-10 text-2xl font-bold cursor-pointer"
          onClick={() => navigate("/app")}
        >
          <span className="text-black">Ask</span>
          <span className="text-indigo-500">Vox</span>
        </div>

        {/* Title */}
        <h1 className="text-lg font-bold mb-6">Settings</h1>

        {/* Options */}
        <div className="flex flex-col items-center justify-center space-y-4 text-gray-700">
          <button
            onClick={() => navigate("/updateAcc")}
          >
            Profile Settings
          </button>
          <button
            onClick={() => alert("Clear Chat History")}
          >
            Clear Chat History
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
