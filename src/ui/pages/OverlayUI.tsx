import { useEffect, useRef, useState } from "react";
import { IoIosSend } from "react-icons/io";
import { FaMicrophone, FaYoutube } from "react-icons/fa";
import { CiGlobe, CiImageOn } from "react-icons/ci";

const OverlayUI = () => {
  const [messages, setMessages] = useState([
    { role: "Vox", content: "Hello! How can I assist you today?" },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [messageTag, setMessageTag] = useState<string>("");
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
        { role: "assistant", content: "Error processing your request." },
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

  const handleLLMResponse = (message: string, role: string): JSX.Element => {
    // Regular expressions for checking image and video URLs
    const imageRegex = /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i;
    const youtubeRegex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/i;

    if (imageRegex.test(message)) {
      return (
        <div className="w-full animate-pop-up">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.open(message, "_blank");
            }}
          >
            <img
              src={message}
              alt="Image"
              width={"100%"}
              className="rounded-lg"
            />
          </a>
        </div>
      );
    } else if (youtubeRegex.test(message)) {
      const match = message.match(youtubeRegex);
      const videoId = match ? match[1] : null;

      if (videoId) {
        return (
          <div className="w-full animate-pop-up">
            <iframe
              width="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            ></iframe>
          </div>
        );
      }
    }

    return (
      <p
        className={`px-4 py-2 rounded-lg animate-pop-up ${
          role === "user"
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-200"
        }`}
      >
        {message}
      </p>
    );
  };

  return (
    <div className="flex flex-col h-screen items-center justify-center  text-white text-sm gap-3">
      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto  w-[300px] space-y-4 max-h-[70vh]  scrollbar-hide rounded-lg">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {/* make this div pop up animation */}

            {handleLLMResponse(message.content, message.role)}
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
      <div className="pointer-events-auto w-[300px]">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-grow  p-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a message..."
            />
            <button
              onClick={sendMessage}
              className="px-2 py-2 text-xl bg-blue-500 rounded-lg hover:scale-110 hover:shadow-md hover:shadow-blue-500 focus:outline-none transition-transform duration-300"
            >
              <IoIosSend />
            </button>
            <button
              onClick={handleRecord}
              className={`px-2 py-2 text-xl rounded-lg ${
                isRecording
                  ? "bg-red-500 hover:shadow-red-500"
                  : "bg-green-600 hover:shadow-green-600"
              } hover:scale-110 hover:shadow-md  transition-transform duration-300`}
            >
              <FaMicrophone />
            </button>
          </div>

          <div className="flex text-sm gap-2">
            <button
              onClick={() => setMessageTag("websearch")}
              className="flex items-center  gap-2 px-4 py-2  bg-blue-500 rounded-full hover:scale-110 hover:shadow-md hover:shadow-blue-500 focus:outline-none transition-transform duration-300"
            >
              <CiGlobe />
              search
            </button>
            <button
              onClick={() => setMessageTag("show me an image")}
              className="flex items-center  gap-2 px-4 py-2  bg-purple-500 rounded-full hover:scale-110 hover:shadow-md hover:shadow-purple-500 focus:outline-none transition-transform duration-300"
            >
              <CiImageOn />
              image
            </button>
            <button
              onClick={() => setMessageTag("show me a video")}
              className="flex items-center  gap-2 px-4 py-2  bg-red-500 rounded-full hover:scale-110 hover:shadow-md hover:shadow-red-500 focus:outline-none transition-transform duration-300"
            >
              <FaYoutube />
              video
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverlayUI;
