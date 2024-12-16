import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ApplicationUI.css";
import LogoutModal from "./LogoutModal";

const ApplicationUI = () => {
  const [messages, setMessages] = useState([
    { role: "Vox", content: "Hello! How can I assist you today?" },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 800) {
        // Only set isSidebarVisible to true if the window is large
        setIsSidebarVisible(true);
      }
    };

    // Initial check
    handleResize();

    // Attach event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll to the latest message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  // Handle text message submission
  const sendMessage = async () => {
    if (userInput.trim() === "") return;

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userInput }]);
    setUserInput("");

    setIsLoading(true); // Start loading animation

    // Send text to backend and wait for the response
    try {
      //@ts-ignore
      const response = await window.electronAPI.textInput(userInput);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "Vox", content: "Error processing your request." },
      ]);
    } finally {
      setIsLoading(false); // Stop loading animation
    }
  };

  // Handle recording toggle
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

  // Handle audio submission
  const sendAudio = async (audioBlob: Blob) => {
    setIsLoading(true); // Start loading animation

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      if (reader.result === null) return;

      const base64Audio = (reader.result as string).split(",")[1]; // Extract base64 data

      try {
        //@ts-ignore
        const response = await window.electronAPI.sendAudio(base64Audio);

        setMessages((prev) => [...prev, { role: "user", content: response }]);

        //@ts-ignore
        const llm_response = await window.electronAPI.textInput(response);

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: llm_response },
        ]);
      } catch (error) {
        console.error("Error processing audio or sending message:", error);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error processing your request." },
        ]);
      } finally {
        setIsLoading(false); // Stop loading animation
      }
    };
  };

  // Handle logout
  const handleLogout = () => {
    setIsModalVisible(true); // Show the modal
  };

  const handleConfirmLogout = () => {
    setIsModalVisible(false); // Close the modal
    window.location.href = "/"; // Redirect to homepage or logout page
  };

  const handleCancelLogout = () => {
    setIsModalVisible(false); // Close the modal without doing anything
  };

  //Handle Routing
  const goToUpgrade = () => {
    navigate("/upgrade"); // Navigate to the Upgrade page
  };

  return (
    <div
      className={`app-container ${!isSidebarVisible ? "sidebar-hidden" : ""}`}
    >
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <img
          src={
            isSidebarVisible
              ? "/public/sidebar_open.png"
              : "/public/sidebar_close.png"
          }
          alt={isSidebarVisible ? "Close Sidebar" : "Open Sidebar"}
          className="toggle-icon"
        />
      </button>

      <div className={`sidebar ${!isSidebarVisible ? "hidden" : ""}`}>
        <h2>History</h2>
        <ul>
          <li>Composite bow stats</li>
          <li>How do I beat Battlemage</li>
          <li>How do I get to Abyssal Woods</li>
        </ul>
        <button onClick={goToUpgrade} className="upgrade-plan">
          Upgrade plan
        </button>
      </div>

      {/* Main Content */}
      <div className={`main-content ${!isSidebarVisible ? "centered" : ""}`}>
        {/* Top-right Profile Dropdown */}
        <div className="profile-container">
          <div className="profile-icon" onClick={toggleDropdown}>
            <img src="/public/user.png" alt="Profile" className="icon" />
            {dropdownOpen && (
              <div className="dropdown-menu">
                <ul>
                  <li>Settings</li>
                  <li onClick={goToUpgrade}>Upgrade Plan</li>
                  <li onClick={handleLogout}>Logout</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Greeting */}
        <div className="greeting">
          <h1>
            Hi, <b>&lt;username&gt;</b>
          </h1>
        </div>

        {/* Chat Area */}
        <div className="chat-area scrollbar-hide">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`chat-message ${
                message.role === "user" ? "user" : "assistant"
              }`}
            >
              <div className={`chat-bubble ${message.role}`}>
                {message.content}
              </div>
            </div>
          ))}
          {/* Loading Animation */}
          {isLoading && (
            <div className="chat-message assistant">
              <div className="chat-bubble assistant">
                <span className="animate-pulse">...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-area">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask me anything"
          />
          <button onClick={sendMessage} className="send-button">
            Send
          </button>
          <button
            onClick={handleRecord}
            className={`px-4 py-2 rounded-lg ${
              isRecording ? "bg-red-600" : "bg-green-600"
            } hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            {isRecording ? "Stop" : "Record"}
          </button>
        </div>
      </div>
      {/* Logout Confirmation Modal */}
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
