import { useEffect, useRef, useState } from "react";
import { IoIosSend } from "react-icons/io";
import { FaMicrophone, FaYoutube } from "react-icons/fa";
import { CiGlobe, CiImageOn } from "react-icons/ci";

const ApplicationSideBarUI = () => {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! How can I assist you today?" },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [messageTag, setMessageTag] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to the latest message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle text message submission
  const sendMessage = () => {
    if (userInput.trim() === "") return;

    const taggedMessage = messageTag ? `${userInput} ${messageTag}` : userInput;

    setMessages((prev) => [...prev, { role: "user", content: userInput }]);

    try {
      let aiResponse = "";

      // Send the message via Electron API
      //@ts-ignore
      window.llmAPI.sendText(taggedMessage, "sidebar");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "..." }, // Append new assistant message
      ]);

      // Listen for streamed text chunks
      //@ts-ignore
      window.llmAPI.onStreamText((textChunk) => {
        aiResponse += textChunk;

        // Update the last assistant message progressively
        setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, content: aiResponse } : msg
          )
        );
      });

      // Handle when streaming is complete
      //@ts-ignore
      window.llmAPI.onStreamComplete((fullText) => {
        console.log("Streaming Complete:", fullText);
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error processing your request." },
      ]);
    }

    setUserInput("");
  };

  // Handle recording toggle
  const handleRecord = () => {
    if (isRecording) {
      if (mediaRecorder.current) {
        mediaRecorder.current.stop();
        mediaRecorder.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
      setIsRecording(false);
      return;
    }

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
      setIsRecording(true);
    });
  };

  // Handle audio submission
  const sendAudio = async (audioBlob: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      if (reader.result === null) return;

      const base64Audio = (reader.result as string).split(",")[1]; // Extract base64 data

      try {
        //@ts-ignore
        const response = await window.llmAPI.sendAudioToElectron(base64Audio);

        setMessages((prev) => [...prev, { role: "user", content: response }]);

        let aiResponse = "";

        // Send the message via Electron API
        //@ts-ignore
        window.llmAPI.sendText(response, "sidebar");

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "..." }, // Append new assistant message
        ]);

        // Listen for streamed text chunks
        //@ts-ignore
        window.llmAPI.onStreamText((textChunk) => {
          aiResponse += textChunk;

          // Update the last assistant message progressively
          setMessages((prev) =>
            prev.map((msg, index) =>
              index === prev.length - 1 ? { ...msg, content: aiResponse } : msg
            )
          );
        });

        // Handle when streaming is complete
        //@ts-ignore
        window.llmAPI.onStreamComplete((fullText) => {
          console.log("Streaming Complete:", fullText);
        });
      } catch (error) {
        console.error("Error processing audio or sending message:", error);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error processing your request." },
        ]);
      }
    };
  };

  const handleLLMResponse = (message: string, role: string): JSX.Element => {
    const imageRegex = /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i;
    const youtubeRegex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/i;

    if (imageRegex.test(message)) {
      return (
        <div className="w-full animate-pop-up">
          <a href={message} target="_blank" rel="noopener noreferrer">
            <img src={message} alt="Image" className="rounded-lg w-full" />
          </a>
        </div>
      );
    } else if (youtubeRegex.test(message)) {
      const match = message.match(youtubeRegex);
      const videoId = match ? match[1] : null;

      if (videoId) {
        return (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              className="absolute top-0 left-0 w-full h-full"
              allowFullScreen
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
    <div className="flex flex-col h-screen items-center justify-center text-white font-thin text-sm gap-3">
      {/* Chat Area */}
      <div className="flex-grow  overflow-y-auto w-[300px] space-y-4 max-h-[70vh] scrollbar-hide rounded-lg">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {handleLLMResponse(message.content, message.role)}
          </div>
        ))}

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
              className="flex-grow p-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a message..."
            />
            <button
              onClick={sendMessage}
              className="px-2 py-2 text-xl bg-blue-500 rounded-lg hover:scale-110 hover:shadow-md hover:shadow-blue-500 transition-transform duration-300"
            >
              <IoIosSend />
            </button>
            <button
              onClick={handleRecord}
              className={`px-2 py-2 text-xl rounded-lg ${
                isRecording
                  ? "bg-red-500 hover:shadow-red-500"
                  : "bg-green-600 hover:shadow-green-600"
              } hover:scale-110 hover:shadow-md transition-transform duration-300`}
            >
              <FaMicrophone />
            </button>
          </div>

          {/* Toggleable Message Tags */}
          <div className="flex text-sm gap-2 ">
            {/* Search Button */}
            <button
              onClick={() =>
                setMessageTag((prev) =>
                  prev === "websearch" ? null : "websearch"
                )
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-transform duration-300 ${
                messageTag === "websearch"
                  ? "bg-blue-500 shadow-md shadow-blue-500"
                  : "bg-blue-500 hover:scale-110 hover:shadow-md hover:shadow-blue-500"
              }`}
            >
              <CiGlobe />
              Search
            </button>

            {/* Image Button */}
            <button
              onClick={() =>
                setMessageTag((prev) =>
                  prev === "show me an image" ? null : "show me an image"
                )
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-transform duration-300  ${
                messageTag === "show me an image"
                  ? "bg-purple-700 shadow-md shadow-purple-700"
                  : "bg-purple-700 hover:scale-110 hover:shadow-md hover:shadow-purple-700"
              }`}
            >
              <CiImageOn />
              Image
            </button>

            {/* Video Button */}
            <button
              onClick={() =>
                setMessageTag((prev) =>
                  prev === "show me a video" ? null : "show me a video"
                )
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-transform duration-300  ${
                messageTag === "show me a video"
                  ? "bg-red-500 shadow-md shadow-red-500"
                  : "bg-red-500 hover:scale-110 hover:shadow-md hover:shadow-red-500"
              }`}
            >
              <FaYoutube />
              Video
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSideBarUI;
