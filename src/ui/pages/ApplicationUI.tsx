import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext"; // Import the useTheme hook
import LogoutModal from "./LogoutModal";

const ApplicationUI = () => {
  const [messages, setMessages] = useState([
    { role: "Vox", content: "Hello! How can I assist you today?" },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [chatHistory, setChatHistory] = useState<string[]>([
    "Composite bow stats",
    "How do I beat Battlemage",
    "How do I get to Abyssal Woods",
  ]);

  // Get theme context
  const { isDarkMode } = useTheme();

  const clearChatHistory = () => {
    setChatHistory([]);
  };

  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 800 && !isSidebarVisible) {
        setIsSidebarVisible(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const sendMessage = async () => {
    if (userInput.trim() === "") return;
    setMessages((prev) => [...prev, { role: "user", content: userInput }]);
    setUserInput("");
    setIsLoading(true);
    try {
      //@ts-ignore
      const response = await window.electronAPI.textInput(userInput);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "Vox", content: "Error processing your request." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecord = () => {
    //@ts-ignore
    window.electronAPI.toggleRecording(!isRecording);
    if (!isRecording) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const recorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];
        recorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(audioChunks, { type: "audio/wav" });
          sendAudio(blob);
        };
        recorder.start();
        mediaRecorder.current = recorder;
      });
    } else if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording((prev) => !prev);
  };

  const sendAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      if (reader.result === null) return;
      const base64Audio = (reader.result as string).split(",")[1];
      try {
        //@ts-ignore
        const response = await window.electronAPI.sendAudio(base64Audio);
        setMessages((prev) => [...prev, { role: "user", content: response }]);
        //@ts-ignore
        const llm_response = await window.electronAPI.textInput(response);
        setMessages((prev) => [...prev, { role: "assistant", content: llm_response }]);
      } catch (error) {
        console.error("Error processing audio or sending message:", error);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error processing your request." },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
  };

  const handleLogout = () => {
    setIsModalVisible(true);
  };

  const handleConfirmLogout = () => {
    setIsModalVisible(false);
    window.location.href = "/";
  };

  const handleCancelLogout = () => {
    setIsModalVisible(false);
  };

  const goToUpgrade = () => {
    navigate("/upgrade");
  };

  const goToSettings = () => {
    navigate("/settings");
  };

  const startNewChat = () => {
    setMessages([{ role: "Vox", content: "Hello! How can I assist you today?" }]);
  };

  return (
    <div
      className={`flex h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      } ${!isSidebarVisible ? "sidebar-hidden" : ""}`}
    >
      {/* Sidebar Toggle Button */}
      <button
        className="fixed top-4 left-4 z-50 bg-transparent border-none cursor-pointer"
        onClick={toggleSidebar}
      >
        <img
          src={isSidebarVisible ? "/public/sidebar_open.png" : "/public/sidebar_close.png"}
          alt={isSidebarVisible ? "Close Sidebar" : "Open Sidebar"}
          className="w-8 h-8"
        />
      </button>

      {/* Sidebar */}
      <div
        className={`flex flex-col justify-between ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-gray-900 text-white"
        } p-4 transition-all duration-300 ${
          isSidebarVisible ? "w-1/5" : "hidden"
        }`}
      >
        {/* New Chat Button */}
        <button
          className="self-end mt-1 mb-4 bg-transparent border-none cursor-pointer"
          onClick={startNewChat}
          title="Start New Chat"
        >
          <img
            src="/public/new_chat.png"
            alt="Start New Chat"
            className="w-6 h-6"
          />
        </button>

        <h2 className="pt-12 mb-4">History</h2>
        <ul className="space-y-4">
          {chatHistory.length > 0 ? (
            chatHistory.map((item, index) => <li key={index}>{item}</li>)
          ) : (
            <li>No history available</li>
          )}
        </ul>
        <button
          onClick={goToUpgrade}
          className={`mt-auto ${
            isDarkMode
              ? "bg-purple-700 hover:bg-purple-800"
              : "bg-purple-600 hover:bg-purple-700"
          } text-white text-center py-2 px-4 rounded-lg`}
        >
          Upgrade Plan
        </button>
      </div>

      {/* Main Chat Area */}
      <div
        className={`flex-grow flex flex-col ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
        } p-8 relative max-w-[60%] mx-auto`}
      >
        {/* Dropdown Menu */}
        <div className="absolute top-4 right-4">
          <div className="relative">
            <img
              src="/public/user.png"
              alt="Profile"
              className="w-8 h-8 rounded-full cursor-pointer"
              onClick={toggleDropdown}
            />
            {dropdownOpen && (
              <div
                className={`absolute right-0 mt-2 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-300"
              } border rounded-lg shadow-lg w-36`}
            >
              <ul className={`py-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                <li
                  className={`px-4 py-2 cursor-pointer ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                  onClick={goToSettings}
                >
                  Settings
                </li>
                <li
                  className={`px-4 py-2 cursor-pointer ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                  onClick={goToUpgrade}
                >
                  Upgrade Plan
                </li>
                <li
                  className={`px-4 py-2 cursor-pointer ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                  onClick={handleLogout}
                >
                  Logout
                </li>
              </ul>
            </div>
          )}
          </div>
        </div>

        {/* Chat Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            Hi, username
          </h1>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } mb-4`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg shadow-md ${
                  message.role === "user"
                    ? isDarkMode
                      ? "bg-blue-700 text-white"
                      : "bg-blue-500 text-white"
                    : isDarkMode
                    ? "bg-gray-700 text-gray-200"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div
                className={`max-w-xs px-4 py-2 rounded-lg shadow-md ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-200"
                    : "bg-gray-200 text-gray-800"
                } animate-pulse`}
              >
                ...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="relative w-full">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask me anything"
            className={`w-full px-4 py-2 border rounded-lg pr-28 ${
              isDarkMode
                ? "bg-gray-800 text-white border-gray-700"
                : "bg-white text-black border-gray-300"
            }`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2">
            <button onClick={sendMessage} className="p-1 rounded-lg">
              <img
                src="/send.png"
                alt="Send"
                className="h-6 w-6"
              />
            </button>
            <button onClick={handleRecord} className="p-1 rounded-lg">
              <img 
                src={isRecording ? "/red_mic.png" : "/blacked_mic.png"} 
                alt={isRecording ? "Stop Recording" : "Start Recording"} 
                className="h-6 w-6" 
              />
            </button>
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      {isModalVisible && (
        <LogoutModal
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
        />
      )}
    </div>
  );
};

export default ApplicationUI;