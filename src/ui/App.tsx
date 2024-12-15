import { useEffect, useRef, useState } from "react";
import "./App.css"; // Import the CSS file
import LogoutModal from './LogoutModal'; // Import the LogoutModal components

function App() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! How can I assist you today?" },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
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

  const sendMessage = async () => {
    if (userInput.trim() === "") return;

    setMessages((prev) => [...prev, { role: "user", content: userInput }]);
    setUserInput("");

    try {
      //@ts-ignore
      const response = await window.electronAPI.textInput(userInput);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error processing your request." },
      ]);
    }
  };

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

  return (
    <div className={`app-container ${!isSidebarVisible ? "sidebar-hidden" : ""}`}>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <img
          src={
            isSidebarVisible
              ? "/src/ui/Assets/Images/sidebar_open.png"
              : "/src/ui/Assets/Images/sidebar_close.png"
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
        <div className="upgrade-plan">Upgrade plan</div>
      </div>

      {/* Main Content */}
      <div className={`main-content ${!isSidebarVisible ? "centered" : ""}`}>
        {/* Top-right Profile Dropdown */}
        <div className="profile-container">
          <div className="profile-icon" onClick={toggleDropdown}>
            <img
              src="/src/ui/Assets/Images/user.png"
              alt="Profile"
              className="icon"
            />
            {dropdownOpen && (
              <div className="dropdown-menu">
                <ul>
                  <li>Settings</li>
                  <li>Upgrade Plan</li>
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
        <div className="chat-area">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`chat-message ${message.role === "user" ? "user" : "assistant"}`}
            >
              <div className={`chat-bubble ${message.role}`}>{message.content}</div>
            </div>
          ))}
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
        </div>
      </div>
      {/* Logout Confirmation Modal */}
      {isModalVisible && (
        <LogoutModal onConfirm={handleConfirmLogout} onCancel={handleCancelLogout} />
      )}
    </div>
  );
}

export default App;
