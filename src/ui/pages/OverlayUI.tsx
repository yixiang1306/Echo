import { useEffect, useRef, useState } from "react";
// import { IoIosSend } from "react-icons/io";
// import { FaMicrophone, FaYoutube } from "react-icons/fa";
// import { CiGlobe, CiImageOn } from "react-icons/ci";
import { motion } from "motion/react";

const OverlayUI = () => {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! How can I assist you today?" },
  ]);
  // const [userInput, setUserInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  // const [messageTag, setMessageTag] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [position, setPosition] = useState({ x: 0, y: 0 }); // for eye position
  const [isAwake, setIsAwake] = useState<boolean>(false); // for wake up animation
  const [isOpen, setIsOpen] = useState<boolean>(false); // for overlay open an close
  const [isThinking, setIsThinking] = useState<boolean>(false); // for thinking animation - streaming llm
  const [isBlinking, setIsBlinking] = useState<boolean>(false); // for eye blinking
  const [showChatBox, setShowChatBox] = useState<boolean>(false); // for chat visibility
  let sleepTimeout: NodeJS.Timeout | null = null;

  // Handle text message submission for testing
  // const sendMessage = () => {
  //   if (userInput.trim() === "") return;

  //   const taggedMessage = messageTag ? `${userInput} ${messageTag}` : userInput;

  //   setMessages((prev) => [...prev, { role: "user", content: userInput }]);

  //   try {
  //     let aiResponse = "";

  //     // Send the message via Electron API
  //     //@ts-ignore
  //     window.llmAPI.sendText(taggedMessage, "overlay");

  //     setMessages((prev) => [
  //       ...prev,
  //       { role: "assistant", content: "..." }, // Append new assistant message
  //     ]);

  //     // Listen for streamed text chunks
  //     //@ts-ignore
  //     window.llmAPI.onStreamText((textChunk) => {
  //       aiResponse += textChunk;

  //       // Update the last assistant message progressively
  //       setMessages((prev) =>
  //         prev.map((msg, index) =>
  //           index === prev.length - 1 ? { ...msg, content: aiResponse } : msg
  //         )
  //       );
  //     });

  //     // Handle when streaming is complete
  //     //@ts-ignore
  //     window.llmAPI.onStreamComplete((fullText) => {
  //       console.log("Streaming Complete:", fullText);
  //     });
  //   } catch (error) {
  //     console.error("Error sending message:", error);
  //     setMessages((prev) => [
  //       ...prev,
  //       { role: "assistant", content: "Error processing your request." },
  //     ]);
  //   }

  //   setUserInput("");
  // };

  //To handle LLM response and return component -> img,txt,video
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
            : "bg-[#212121] text-gray-200"
        }`}
      >
        {message}
      </p>
    );
  };

  const sleep = () => {
    console.log("Sleeping...");
    sleepTimeout = setTimeout(() => {
      setIsAwake(false);
    }, 1000);
  };

  const closeChatBox = (time: number = 800) => {
    setTimeout(() => {
      setShowChatBox(false);
    }, time);
  };

  // Handle audio submission
  const sendAudio = async (audioBlob: Blob) => {
    setIsThinking(true);
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
        window.llmAPI.sendText(response, "overlay");

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

  // Start recording
  const startRecording = () => {
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          noiseSuppression: true,
          echoCancellation: true,
        },
      })
      .then(async (stream) => {
        const recorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];
        const audioContext = new AudioContext();

        // Ensure AudioContext is active
        if (audioContext.state === "suspended") {
          await audioContext.resume();
          console.log("AudioContext resumed");
        }

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();

        source.connect(analyser);

        analyser.fftSize = 4096; // High resolution
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let hasSound = false;
        let silenceTimeout: NodeJS.Timeout | null = null;
        let recordingActive = true; // Local control variable

        const stopRecording = () => {
          recordingActive = false; // Stop silence detection loop
          setIsRecording(false); // Update global recording state
          recorder.stop();
          stream.getTracks().forEach((track) => track.stop());
          audioContext.close();
          console.log("Recording stopped.");
        };

        const checkSilence = () => {
          if (!recordingActive) return; // Exit the loop if recording is inactive

          analyser.getByteFrequencyData(dataArray);

          // Compute volume as average of frequency values
          const volume =
            dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;

          if (volume > 20) {
            hasSound = true;
            if (silenceTimeout) {
              console.log("Voice Detected - Resuming Recording...");
              clearTimeout(silenceTimeout);
              silenceTimeout = null;
            }
          } else {
            if (!silenceTimeout) {
              console.log("voice volume", volume);
              silenceTimeout = setTimeout(() => {
                console.log("Silence Detected - Stopping Recording...");
                stopRecording();
              }, 3000); // Stop after 3 seconds of silence
            }
          }

          requestAnimationFrame(checkSilence); // Keep checking if recording is active
        };

        recorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunks, { type: "audio/wav" });

          if (hasSound) {
            console.log("Sending audio...");
            sendAudio(blob);
          } else {
            console.log("No voice detected - Audio discarded.");
            //@ts-ignore
            window.overlayManagerAPI.resumeWakeUp();
            sleep();
          }
        };

        recorder.start();
        console.log("Recording started...");
        checkSilence(); // Start monitoring silence
      })
      .catch((err) => {
        console.error("Microphone access error:", err);
        setIsRecording(false); // Reset recording state if there's an error
      });
  };

  //Eye Movements
  useEffect(() => {
    const interval = setInterval(() => {
      setPosition({
        x: (Math.random() - 0.5) * 20, // Random x movement
        y: (Math.random() - 0.5) * 20, // Random y movement
      });
    }, 4000); // Moves every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150); // Eye stays closed briefly
    }, 4500);

    return () => clearInterval(blinkInterval);
  }, []);

  // HANDLE ALL LISTENERS HERE
  useEffect(() => {
    const overlayToggleHandler = () => {
      setIsOpen((prev) => !prev);
      setIsAwake(true);
      sleep();
    };
    const streamStartHandler = () => {
      setIsThinking(true);
      setShowChatBox(true);
    };

    const streamCompleteHandler = () => {
      console.log("stream completed - resuming wake up");
      setIsThinking(false);

      if (!showChatBox) {
        setShowChatBox(true);
      }
    };
    const wakeUpHandler = () => {
      if (sleepTimeout) {
        // alert("clearing sleep timeout");
        clearTimeout(sleepTimeout);
      }
      setIsOpen(true);
      setIsRecording(true); // Explicitly set recording state to true
      setIsAwake(true);
      startRecording();
    };

    const endAudioHandler = () => {
      //@ts-ignore
      window.overlayManagerAPI.resumeWakeUp();
      sleep();
      closeChatBox();
    };

    const notTextHandler = () => {
      //@ts-ignore
      window.overlayManagerAPI.resumeWakeUp();
      sleep();
    };

    // Add listeners

    //@ts-ignore
    window.overlayManagerAPI.onToggleOverlay(overlayToggleHandler);
    //@ts-ignore
    window.overlayManagerAPI.onWakeUpCommand(wakeUpHandler);
    //@ts-ignore
    window.llmAPI.onStreamStart(streamStartHandler);
    //@ts-ignore
    window.llmAPI.onStreamComplete(streamCompleteHandler);
    //@ts-ignore
    window.llmAPI.notTextListener(notTextHandler);

    //@ts-ignore
    window.audioManagerAPI.onEndAudio(endAudioHandler);

    // Cleanup
    return () => {
      //@ts-ignore
      window.overlayManagerAPI.removeWakeUpCommandListener(wakeUpHandler);
      //@ts-ignore
      window.overlayManagerAPI.removeToggleOverlayListener(
        overlayToggleHandler
      );
      //@ts-ignore
      window.llmAPI.removeStreamStartListener(streamStartHandler);
      //@ts-ignore
      window.llmAPI.removeStreamCompleteListener(streamCompleteHandler);
      //@ts-ignore
      window.llmAPI.removeNotTextListener(notTextHandler);
      //@ts-ignore
      window.audioManagerAPI.removeEndAudioListener(endAudioHandler);
    };
  }, [isOpen]);

  return (
    <div className="flex flex-col h-screen text-white  text-sm gap-3 relative">
      {/* AI creature */}
      <motion.div
        className="absolute top-10 right-10"
        initial={false}
        animate={{
          scale: isOpen ? 1 : 0, // Open/close transition
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* AI Main Container with Smooth Scaling & Opacity */}
        <motion.div
          className="w-16 h-16 flex items-center justify-center rounded-full shadow-lg border-2"
          animate={{
            scale: isAwake ? [1, 1.1, 1] : 1, // Heartbeat effect
            backgroundColor: "#212121",
            opacity: isAwake ? 1 : 0.1, // Fades out when not awake
            borderColor: isRecording
              ? "rgba(255, 58, 97, 1)"
              : "rgba(255, 255, 255, 1)",
          }}
          transition={{
            scale: isAwake
              ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
              : {},
            backgroundColor: { duration: 0.5, ease: "easeInOut" }, // Smooth color transition
            opacity: { duration: 0.5 }, // Fades smoothly
            borderColor: { duration: 1, ease: "easeInOut" }, // Smooth border color transition
          }}
        >
          {/* Thinking Mode Animation */}
          <motion.div
            animate={{
              scale: isThinking ? 1 : 0, // Scales in and out smoothly
              opacity: isThinking ? 1 : 0, // Fades in/out
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }} // Smooth transition timing
            className="absolute flex items-center justify-center"
          >
            <img
              src="./Interwind.svg"
              alt="Thinking Animation"
              className="w-14 h-14"
            />
          </motion.div>

          {/* Eye Animation (Only Visible When Not Thinking) */}
          <motion.div
            animate={{
              scaleY: isThinking ? 0 : isAwake ? (isBlinking ? 0 : 1) : 0.05, // Eye shrinks when thinking
              scale: isThinking ? 0 : 1, // Slight shrink effect
            }}
            transition={{ duration: 0.3 }} // Smooth transition effect
          >
            <motion.div
              className="w-5 h-5 flex items-center justify-center bg-white rounded-full shadow-lg border-2"
              animate={
                isAwake ? { x: position.x, y: position.y } : { opacity: 0.8 }
              }
              transition={
                isAwake ? { type: "spring", stiffness: 50, damping: 5 } : {}
              }
            ></motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Chat Area (Only Shows Latest Assistant Response) */}
      <motion.div
        className="overflow-y-auto w-[340px] max-h-[70vh] p-1 before:scrollbar-hide rounded-lg mt-[110px]"
        initial={false}
        animate={{
          scale: showChatBox ? 1 : 0,
        }}
        transition={{ delay: 0.2, duration: 0.6, ease: "easeInOut" }}
        style={{ originX: 1, originY: 0 }}
      >
        {messages
          .filter((msg) => msg.role === "assistant") // Filter only assistant messages
          .slice(-1) // Keep only the latest one
          .map((message, index) => (
            <div key={index} className="flex justify-end">
              {handleLLMResponse(message.content, message.role)}
            </div>
          ))}
        <div ref={chatEndRef} />
      </motion.div>

      {/* TOOLS FOR TESTING UI */}
      {/* <div className="pointer-events-auto w-[300px]">
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
              onClick={startRecording}
              className={`px-2 py-2 text-xl rounded-lg ${
                isRecording
                  ? "bg-red-500 hover:shadow-red-500"
                  : "bg-green-600 hover:shadow-green-600"
              } hover:scale-110 hover:shadow-md transition-transform duration-300`}
            >
              <FaMicrophone />
            </button>
          </div>

          <div className="flex text-sm gap-2 ">
            <button
              onClick={() => setIsThinking((prev) => !prev)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-transform duration-300 ${
                messageTag === "websearch"
                  ? "bg-blue-500 shadow-md shadow-blue-500"
                  : "bg-blue-500 hover:scale-110 hover:shadow-md hover:shadow-blue-500"
              }`}
            >
              <CiGlobe />
              Search
            </button>

            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-transform duration-300  ${
                messageTag === "show me an image"
                  ? "bg-purple-700 shadow-md shadow-purple-700"
                  : "bg-purple-700 hover:scale-110 hover:shadow-md hover:shadow-purple-700"
              }`}
            >
              <CiImageOn />
              Image
            </button>

            <button
              onClick={() => setIsAwake((prev) => !prev)}
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
      </div> */}
    </div>
  );
};

export default OverlayUI;
