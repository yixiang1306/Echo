import {
  FaBrain,
  FaGamepad,
  FaGlobe,
  FaHeadset,
  FaKeyboard,
  FaLaptopCode,
  FaMicrochip,
  FaMicrophone,
  FaMouse,
  FaPlayCircle,
  FaRobot,
  FaServer,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Start() {
  const navigate = useNavigate();

  // Define an array of gaming and AI-related icons with positions
  const scatteredIcons = [
    {
      icon: <FaGamepad size={50} />,
      style: "top-10 left-16 text-red-500 shadow-red-400/50",
    },
    {
      icon: <FaHeadset size={50} />,
      style: "top-2/4 right-40 text-blue-400 shadow-blue-300/50",
    },
    {
      icon: <FaKeyboard size={50} />,
      style: "bottom-20 left-1/3 text-yellow-500 shadow-yellow-400/50",
    },
    {
      icon: <FaMouse size={50} />,
      style: "bottom-40 right-1/4 text-green-400 shadow-green-300/50",
    },
    {
      icon: <FaMicrophone size={50} />,
      style: "top-10 right-1/3 text-purple-400 shadow-purple-300/50",
    },
    {
      icon: <FaRobot size={50} />,
      style: "top-40 left-1/4 text-cyan-300 shadow-cyan-200/50",
    },
    {
      icon: <FaMicrochip size={50} />,
      style: "bottom-16 right-10 text-pink-500 shadow-pink-400/50",
    },
    {
      icon: <FaBrain size={50} />,
      style: "top-10 right-20 text-orange-400 shadow-orange-300/50",
    },
    {
      icon: <FaGlobe size={50} />,
      style: "bottom-50 left-20 text-indigo-400 shadow-indigo-300/50",
    },
    {
      icon: <FaPlayCircle size={50} />,
      style: "top-14 right-1/5 text-teal-400 shadow-teal-300/50",
    },
    {
      icon: <FaLaptopCode size={50} />,
      style: "bottom-8 left-1/5 text-blue-300 shadow-blue-200/50",
    },
    {
      icon: <FaServer size={50} />,
      style: "bottom-24 left-40 text-lime-400 shadow-lime-300/50",
    },
  ];

  return (
    <div className="relative flex items-center justify-center h-screen bg-[#121212] text-white">
      {/* Scattered Gaming & AI Icons */}
      {scatteredIcons.map((item, index) => (
        <div
          key={index}
          className={`absolute text-5xl opacity-75 animate-[pulseEffect_2s_infinite] 
                  ${item.style} drop-shadow-[0_0_8px_var(--tw-shadow-color)]`}
        >
          {item.icon}
        </div>
      ))}

      {/* Main Container */}
      <div className="relative flex flex-col items-center text-center bg-[#1e1e1e]/80 p-12 rounded-3xl shadow-xl backdrop-blur-md border border-gray-700">
        {/* Glowing Border Effect */}
        <div className="absolute inset-0 border-[2px] border-blue-500/40 rounded-3xl blur-sm pointer-events-none"></div>

        {/* App Name with Glow */}
        <h1 className="text-6xl font-extrabold tracking  text-white drop-shadow-[0_0_15px_rgba(0,150,255,0.8)]">
          ECHO
        </h1>
        <p className="text-gray-300 text-xl mt-6">
          Game with Insight, Not Just Instinct
        </p>
        <p className="text-gray-300 text-sm mt-2">
          Your Smartest Gaming Companion
        </p>

        <div className="mt-10 flex flex-col items-center w-full gap-4">
          <button
            className="w-80 px-6 py-3 rounded-lg text-lg font-semibold border border-gray-500 text-gray-300 bg-transparent 
         hover:bg-gray-800 hover:text-white transition duration-300 shadow-lg shadow-blue-500/30"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button
            className="w-80 px-6 py-3 rounded-lg text-lg font-semibold bg-blue-700 text-white hover:bg-blue-800 
         transition duration-300 shadow-lg shadow-blue-700/50"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default Start;
