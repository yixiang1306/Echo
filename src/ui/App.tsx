import { useEffect, useRef, useState } from "react";
import "./App.css"; // Import the CSS file

function App() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! How can I assist you today?" },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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
    // Show confirmation dialog
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      // Redirect to the homepage (assuming the homepage is the root)
      window.location.href = "/";
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>History</h2>
        <ul>
          <li>Composite bow stats</li>
          <li>How do I beat Battlemage</li>
          <li>How do I get to Abyssal Woods</li>
        </ul>
        <div className="upgrade-plan">Upgrade plan</div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top-right Dropdown */}
        <div className="profile-icon" onClick={toggleDropdown}>
          <img
            src="https://via.placeholder.com/32"
            alt="Profile"
            className="icon"
          />
          {dropdownOpen && (
            <div className="dropdown-menu">
              <ul>
                <li>Settings</li>
                <li>Upgrade Plan</li>
                <li onClick={handleLogout}>Logout</li> {/* Attach handleLogout here */}
              </ul>
            </div>
          )}
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
              <div className={`chat-bubble ${message.role}`}>
                {message.content}
              </div>
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
    </div>
  );
}

export default App;
