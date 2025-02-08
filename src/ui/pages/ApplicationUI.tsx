import { CircleCheckBig, CircleDollarSign, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../utility/authprovider";
import { supabase } from "../utility/supabaseClient";
import LogoutModal from "./LogoutModal";
import { Session } from "@supabase/supabase-js";
import {
  markUserAsOffline,
  markUserAsOnline,
  syncCoinsAndSubscriptions,
} from "../utility/syncFunctions";
import { FaMicrophone, FaYoutube } from "react-icons/fa";
import { CiGlobe, CiImageOn } from "react-icons/ci";
import { IoIosSend } from "react-icons/io";

export enum MODEL_TYPE {
  ASKVOX = "ASKVOX",
  GPT_4o = "GPT_4o",
}
const ApplicationUI = () => {
  const [messages, setMessages] = useState([
    { role: "Vox", content: "Hello! How can I assist you today?" },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [messageTag, setMessageTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [freeCoin, setFreeCoin] = useState(5.0);
  const [walletCoin, setWalletCoin] = useState(5.0);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [chatHistory] = useState<string[]>([
    "Composite bow stats",
    "How do I beat Battlemage",
    "How do I get to Abyssal Woods",
  ]);
  const { session } = useAuth();

  //------------------ Function the current session and resize handler -------------------------

  useEffect(() => {
    setCurrentSession(session);
    if (session) {
      markUserAsOnline(session.user.id);
      syncCoinsAndSubscriptions(session.user.id);
    }

    //@ts-ignore
    window.electron.openWindows();
    if (currentSession) {
      console.log("session", currentSession.user.id);
    }
    const handleResize = () => {
      if (window.innerWidth > 800) {
        setIsSidebarVisible(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  //------------------ Function to fetch Display name from session -------------------------
  useEffect(() => {
    const fetchName = async () => {
      if (!currentSession) return;
      let { data: User, error } = await supabase
        .from("User")
        .select("firstName,lastName,userType")
        .eq("accountId", currentSession.user.id)
        .single();
      if (error) {
        console.error("Error fetching user data:", error.message);
      } else {
        if (User?.userType === "MONTHLY_SUBSCRIPTION") {
          setIsSubscriptionActive(true);
        } else {
          setIsSubscriptionActive(false);
        }
      }
    };
    const fetchFreeCoin = async () => {
      if (!currentSession) return;
      let { data: free_coin, error } = await supabase
        .from("FreeCoin")
        .select("amount")
        .eq("accountId", currentSession.user.id)
        .single();
      if (error) {
        setFreeCoin(0);
        console.error("Error fetching user data:", error.message);
      } else {
        setFreeCoin(free_coin!.amount as number);
      }
    };
    const fetchWallet = async () => {
      if (!currentSession) return;
      let { data: wallet, error } = await supabase
        .from("Wallet")
        .select("amount")
        .eq("accountId", currentSession.user.id)
        .single();
      if (error) {
        setWalletCoin(0);
        console.error("Error fetching user data:", error.message);
      } else {
        setWalletCoin(wallet!.amount as number);
      }
    };
    fetchName();
    fetchFreeCoin();
    fetchWallet();
  }, [currentSession]);

  //------------------ Function   -------------------------

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  //------------------ Function   -------------------------

  const sendMessage = async () => {
    if (freeCoin <= 0 && walletCoin <= 0) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "You don't have enough coin" },
      ]);
      return;
    }
    if (userInput.trim() === "") return;

    const taggedMessage = messageTag ? `${userInput} ${messageTag}` : userInput;

    setMessages((prev) => [...prev, { role: "user", content: userInput }]);
    setUserInput("");
    setIsLoading(true);

    try {
      console.log(taggedMessage);

      let aiResponse = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]); // Placeholder for streaming

      // Use window.electronAPI.sendText for sending the message
      //@ts-ignore
      window.electronAPI.sendText(userInput);

      // Listen for streamed text chunks
      //@ts-ignore
      window.electronAPI.onStreamText((textChunk) => {
        aiResponse += textChunk;
        setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, content: aiResponse } : msg
          )
        );
      });

      // Handle when streaming is complete
      //@ts-ignore
      window.electronAPI.onStreamComplete((fullText) => {
        console.log("Streaming Complete:", fullText);
        setIsLoading(false);
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error processing your request." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  //------------------ Function   -------------------------

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

  //------------------ Function   -------------------------

  // Handle audio submission
  const sendAudio = async (audioBlob: Blob) => {
    if (freeCoin <= 0 && walletCoin <= 0) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "You don't have enough coin" },
      ]);
      return;
    }
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
        calculateCost(
          { input: response, output: llm_response },
          MODEL_TYPE.ASKVOX
        );
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

  //------------------ Function Sign out   ------------------------

  const handleCleanupSession = async () => {
    //@ts-ignore
    await window.electron.killWindows();
    await markUserAsOffline(currentSession!.user.id);
    const { error } = await supabase.auth.signOut();
    console.error("error sign out", error);
    setIsModalVisible(false);
  };

  const handleLogout = async () => {
    setIsModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    await handleCleanupSession();
  };

  const handleCancelLogout = () => {
    setIsModalVisible(false);
  };

  //------------------ Function   -------------------------

  const goToUpgrade = () => {
    navigate("/upgrade");
  };

  const goToSettings = () => {
    navigate("/settings");
  };

  const startNewChat = () => {
    setMessages([
      { role: "Vox", content: "Hello! How can I assist you today?" },
    ]);
  };

  // const clearChatHistory = () => {
  //   setChatHistory([]);
  // };

  //--------------------Calculate Cost --------------------------
  const calculateCost = async (
    text: { input: string; output: string },
    model: MODEL_TYPE
  ) => {
    //@ts-ignore
    const costData = await window.tokenManagerApi.calculateCost(text, model);

    if (isSubscriptionActive) {
      return;
    } else if (freeCoin > 0) {
      const newAmount = freeCoin - parseFloat(costData.totalCost);
      setFreeCoin(newAmount);
      const { error } = await supabase
        .from("FreeCoin")
        .update({
          amount: newAmount,
          updatedAt: new Date().toISOString(),
        })
        .eq("accountId", currentSession!.user.id);

      if (error) {
        console.error("Error updating free coin amount:", error.message);
      }
    } else if (walletCoin > 0) {
      const newAmount = walletCoin - parseFloat(costData.totalCost);
      console.log("updated amount from Wallet", newAmount);
      setWalletCoin(newAmount);
      const { error } = await supabase
        .from("Wallet")
        .update({
          amount: newAmount,
          updatedAt: new Date().toISOString(),
        })
        .eq("accountId", currentSession!.user.id);

      if (error) {
        console.error("Error updating free coin amount:", error.message);
      }
    }
  };

  //--------------------Get theme context --------------------------
  const { isDarkMode } = useTheme();

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
        className={`px-4 py-2 rounded-lg shadow-md animate-pop-up ${
          role === "user"
            ? isDarkMode
              ? "bg-blue-700 text-white"
              : "bg-blue-500 text-white"
            : isDarkMode
            ? "bg-gray-700 text-gray-200"
            : "bg-gray-200 text-gray-800"
        }`}
      >
        {message}
      </p>
    );
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
          src={isSidebarVisible ? "./sidebar_open.png" : "./sidebar_close.png"}
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
          <img src="./new_chat.png" alt="Start New Chat" className="w-6 h-6" />
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
        } p-8 relative max-w-[500px] mx-auto`}
      >
        {/* Dropdown Menu */}
        <div className="absolute top-4 right-0">
          <div className="flex items-center gap-8">
            <div className="flex gap-8">
              {/* Token Balance Tooltip */}
              <div className="relative group flex gap-2 items-center">
                <CircleDollarSign className="  text-yellow-400" />
                <p className="">{freeCoin.toFixed(4)}</p>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:flex items-center justify-center px-2 py-1 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap">
                  Daily Free Balance
                </div>
              </div>

              {/* Wallet Balance Tooltip */}
              <div className="relative group flex gap-2 items-center">
                <Wallet className=" text-blue-400" />
                <p className="">{walletCoin.toFixed(4)}</p>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:flex items-center justify-center px-2 py-1 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap">
                  Your Wallet Balance
                </div>
              </div>
              {isSubscriptionActive && (
                <div className="relative group flex gap-2 items-center">
                  <CircleCheckBig className=" text-green-600" />
                  <p className=""></p>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:flex items-center justify-center px-2 py-1 bg-gray-800 text-white text-sm rounded-lg ">
                    Your monthly Subscription is active
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <img
                src="./user.png"
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
                  <ul
                    className={`py-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
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
        </div>

        {/* Chat Messages */}
        <div className="flex-grow overflow-y-auto mt-20 scrollbar-hide text-sm ">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } my-4`}
            >
              {handleLLMResponse(message.content, message.role)}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div
                className={`max-w-xs px-4 py-2 rounded-lg shadow-md animate-pop-up${
                  isDarkMode
                    ? "bg-gray-700 text-gray-200"
                    : "bg-gray-200 text-gray-800"
                } `}
              >
                <span className="">...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* User Input */}
        {/* <div className="relative w-full">
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
              <img src="./send.png" alt="Send" className="h-6 w-6" />
            </button>
            <button onClick={handleRecord} className="p-1 rounded-lg">
              <img
                src={isRecording ? "./red_mic.png" : "./blacked_mic.png"}
                alt={isRecording ? "Stop Recording" : "Start Recording"}
                className="h-6 w-6"
              />
            </button>
          </div>
        </div> */}

        <div className="pointer-events-auto w-full">
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
