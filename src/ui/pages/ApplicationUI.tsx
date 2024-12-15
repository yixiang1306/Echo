import { useEffect, useRef, useState } from "react";
const ApplicationUI = () => {
  const [messages, setMessages] = useState([
    { role: "Vox", content: "Hello! How can I assist you today?" },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to the latest message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4">
        <h1 className="text-2xl font-bold">AskVox</h1>
      </div>
      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 max-h-[70vh] scrollbar-hide">
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
        {/* Loading Animation */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xs px-4 py-2 rounded-lg bg-gray-700 text-gray-200">
              <span className="animate-pulse">...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
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
};

export default ApplicationUI;
