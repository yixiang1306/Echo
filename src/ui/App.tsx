import { useState } from "react";

function App() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! How can I assist you today?" },
  ]);
  const [userInput, setUserInput] = useState("");

  const sendMessage = () => {
    if (userInput.trim() === "") return;

    // Add user message
    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);

    // Simulate assistant response (you can integrate your logic here)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "This is a sample response." },
      ]);
    }, 1000);

    setUserInput("");
  };

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 ">
        <h1 className="text-2xl font-bold">AskVox</h1>
      </div>

      {/* Chat Area */}
      <div className=" overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-200"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-grow p-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-red-400 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
