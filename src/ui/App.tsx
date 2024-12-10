import { useState } from "react";

function App() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! How can I assist you today?" },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  // Handle text message submission
  const sendMessage = async () => {
    if (userInput.trim() === "") return;

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userInput }]);
    setUserInput("");

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
        { role: "assistant", content: "Error processing your request." },
      ]);
    }
  };

  // Handle recording toggle
  const handleRecord = () => {
    //@ts-ignore
    window.electronAPI.toggleRecording(!isRecording);
    setIsRecording((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4">
        <h1 className="text-2xl font-bold">AskVox</h1>
      </div>

      {/* Chat Area */}
      <div className="overflow-y-auto p-4 space-y-4  max-h-[70vh]">
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

      {/* Input Area */}
      <div className="p-4 bg-gray-800 rounded-lg w-full max-w-md">
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
            className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
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
    </div>
  );
}

export default App;
