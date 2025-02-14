import { Session } from "@supabase/supabase-js";
import {
  Coins,
  DollarSign,
  Gem,
  ListPlus,
  PanelRightClose,
  PanelRightOpen,
  Settings2,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CiGlobe, CiImageOn } from "react-icons/ci";
import { FaMicrophone, FaYoutube } from "react-icons/fa";
import { IoIosSend } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../utility/authprovider";
import { fetchChatHistory } from "../utility/chatFunctions";
import { CHAT_ROLE, MODEL_TYPE, USER_TYPE } from "../utility/enum";
import { supabase } from "../utility/supabaseClient";
import {
  markUserAsOffline,
  markUserAsOnline,
  syncCoinsAndSubscriptions,
} from "../utility/syncFunctions";
import { fetchFreeCoin, fetchWallet } from "../utility/transcationFunctions";
import { fetchUserType } from "../utility/userFunctions";
import LogoutModal from "./LogoutModal";

export interface ChatHistoryItem {
  id: string;
  title: string;
  createdAt: string;
}
export const defaultWelcomeChat = [
  {
    role: CHAT_ROLE.ASSISTANT,
    content: "Hello! How can I assist you today?",
  },
];

const ApplicationUI = () => {
  const [messages, setMessages] = useState(defaultWelcomeChat);
  const [userInput, setUserInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [messageTag, setMessageTag] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [freeCoin, setFreeCoin] = useState(0.0);
  const [walletCoin, setWalletCoin] = useState(0.0);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const { session } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const hasOpenedWindows = useRef(false); // Track if function has been called

  //------------------ Function to fetch Display name from session -------------------------

  useEffect(() => {
    // @ts-ignore
    window.llmAPI.syncLLMDataListener(() => {
      if (session) {
        checkSubscriptionStatus(session);
        checkUserMoney(session);
        checkChatHistory(session);
      }
    });

    return () => {
      // @ts-ignore
      window.llmAPI.removesyncLLMDataListener();
    };
  }, []);

  const checkSubscriptionStatus = async (session: Session) => {
    const userType = await fetchUserType(session);
    if (userType) {
      if (userType === USER_TYPE.MONTHLY_SUBSCRIPTION) {
        setIsSubscriptionActive(true);
      } else {
        setIsSubscriptionActive(false);
      }
    }
  };
  const checkUserMoney = async (session: Session) => {
    setFreeCoin((await fetchFreeCoin(session)) || 0);
    setWalletCoin((await fetchWallet(session)) || 0);
  };

  const checkChatHistory = async (session: Session) => {
    if (!session) return;
    const chats = await fetchChatHistory(session);
    setChatHistory(chats || []);
    if (chats?.length === 0 || !chats) {
      setMessages(defaultWelcomeChat);
      setActiveChatId(null);
    } else {
      await loadChat(chats[0].id);
    }
  };

  useEffect(() => {
    if (!session) return;

    markUserAsOnline(session.user.id);
    syncCoinsAndSubscriptions(session.user.id);

    if (!hasOpenedWindows.current) {
      // @ts-ignore
      window.electron.openWindows();
      hasOpenedWindows.current = true;
    }

    checkSubscriptionStatus(session);
    checkUserMoney(session);
    checkChatHistory(session);
  }, [session]);

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
        {
          role: CHAT_ROLE.ASSISTANT,
          content: "Not enough credits to chat. Please top up !",
        },
      ]);
      return;
    }

    let chatId = activeChatId;
    if (!chatId) {
      console.log("No active chat, creating one...");
      chatId = await startNewChat(); // ✅ Wait for chat creation
      if (!chatId) {
        console.error("Failed to create a new chat session.");
        return;
      }
      setActiveChatId(chatId);
    }
    if (userInput.trim() === "") return;

    const taggedMessage = messageTag ? `${userInput} ${messageTag}` : userInput;

    setMessages((prev) => [
      ...prev,
      { role: CHAT_ROLE.USER, content: userInput },
    ]);

    try {
      await saveMessagesToSupabase(chatId, userInput, CHAT_ROLE.USER);
      let aiResponse = "";

      // Send the message via Electron API
      //@ts-ignore
      window.llmAPI.sendText(taggedMessage, "main");

      setMessages((prev) => [
        ...prev,
        { role: CHAT_ROLE.ASSISTANT, content: "..." }, // Append new assistant message
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
      window.llmAPI.onStreamComplete(async (fullText) => {
        console.log("Streaming Complete:", fullText);
        await saveMessagesToSupabase(chatId, fullText, CHAT_ROLE.ASSISTANT);
        // Insert assistant message into Supabase
        await calculateCost(
          { input: userInput, output: fullText },
          MODEL_TYPE.ASKVOX
        );

        //@ts-ignore
        window.llmAPI.removeStreamCompleteListener();
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: CHAT_ROLE.ASSISTANT,
          content: "Error processing your request.",
        },
      ]);
    }

    setUserInput("");
  };

  const saveMessagesToSupabase = async (
    chatId: string, // ✅ Pass chatId as an argument
    content: string,
    role: CHAT_ROLE
  ) => {
    if (!chatId) {
      console.error("Error: No active chat ID found!");
      return;
    }

    try {
      const { error } = await supabase.from("Conversation").insert([
        {
          chatHistoryId: chatId,
          role,
          content,
          createdAt: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
    } catch (error) {
      console.error("Error saving message to Supabase:", error);
    }
  };

  //------------------ Function   -------------------------

  // Handle recording toggle
  const handleRecord = () => {
    //@ts-ignore
    window.llmAPI.toggleRecording(!isRecording);

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
        {
          role: CHAT_ROLE.ASSISTANT,
          content: "Not enough credits to chat. Please top up !",
        },
      ]);
      return;
    }
    let chatId = activeChatId;
    if (!chatId) {
      console.log("No active chat, creating one...");
      chatId = await startNewChat(); // ✅ Wait for chat creation
      if (!chatId) {
        console.error("Failed to create a new chat session.");
        return;
      }
      setActiveChatId(chatId);
    }
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      if (reader.result === null) return;

      const base64Audio = (reader.result as string).split(",")[1]; // Extract base64 data

      try {
        //@ts-ignore
        const response = await window.llmAPI.sendAudioToElectron(base64Audio);

        setMessages((prev) => [
          ...prev,
          { role: CHAT_ROLE.USER, content: response },
        ]);
        await saveMessagesToSupabase(chatId, response, CHAT_ROLE.USER);
        let aiResponse = "";

        // Send the message via Electron API
        //@ts-ignore
        window.llmAPI.sendText(response, "main");

        setMessages((prev) => [
          ...prev,
          { role: CHAT_ROLE.ASSISTANT, content: "..." }, // Append new assistant message
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
        window.llmAPI.onStreamComplete(async (fullText) => {
          console.log("Streaming Complete:", fullText);
          await saveMessagesToSupabase(chatId, fullText, CHAT_ROLE.ASSISTANT);
          await calculateCost(
            { input: response, output: fullText },
            MODEL_TYPE.ASKVOX
          );
          //@ts-ignore
          window.llmAPI.removeStreamCompleteListener();
        });
      } catch (error) {
        console.error("Error processing audio or sending message:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: CHAT_ROLE.ASSISTANT,
            content: "Error processing your request.",
          },
        ]);
      }
    };
  };

  //------------------ Function Sign out   ------------------------

  const handleCleanupSession = async () => {
    if (!session) return;
    //@ts-ignore
    console.log("sign out session", session.user.id);
    // @ts-ignore
    await window.electron.killWindows();
    await markUserAsOffline(session.user.id);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("error sign out", error);
    }

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

  const startNewChat = async (): Promise<string | null> => {
    if (!session) return null;
    console.log("active fron start", activeChatId);

    try {
      console.log("creating chat");
      const { data: newChat, error } = await supabase
        .from("ChatHistory")
        .insert([
          {
            accountId: session.user.id,
            title: "New Chat",
            createdAt: new Date().toISOString(),
          },
        ])
        .select()
        .single(); // Ensure single object is returned

      if (error) {
        console.error("Error creating new chat:", error.message);
        return null;
      }
      console.log("chatid", newChat.id);

      setChatHistory((prev) => [
        {
          id: newChat.id,
          title: newChat.title,
          createdAt: newChat.createdAt,
        },
        ...prev,
      ]);
      setActiveChatId(newChat.id);
      await loadChat(newChat.id);
      console.log("active fron start", newChat.id);
      return newChat.id; // Return new chat ID
    } catch (error) {
      console.error("Error starting new chat:", error);
      return null;
    }
  };

  const clearChatHistory = async (chatId: string) => {
    if (!session) return;
    try {
      // Delete all chats for the current user

      const { error: ConversationError } = await supabase
        .from("Conversation")
        .delete()
        .eq("chatHistoryId", chatId);
      if (ConversationError) {
        console.error(
          "Error clearing conversation history:",
          ConversationError.message
        );
        return;
      }
      const { error } = await supabase
        .from("ChatHistory")
        .delete()
        .eq("id", chatId);

      if (error) {
        console.error("Error clearing chat history:", error.message);
        return;
      }

      // Reset local state
      await checkChatHistory(session);
      // @ts-ignore
      window.electron.startSync("main");
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  };

  const handleCreateNewChat = async () => {
    // @ts-ignore
    window.electron.startSync("main");
    await startNewChat();
  };

  const loadChat = async (chatId: string) => {
    console.log("crrent active one", chatId);
    try {
      const { data: messages, error } = await supabase
        .from("Conversation")
        .select("role, content")
        .eq("chatHistoryId", chatId)
        .order("createdAt", { ascending: true });

      if (error) {
        console.error("Error loading chat messages:", error.message);
        return;
      }

      setActiveChatId(chatId); // Set the active chat ID
      if (messages.length <= 0 || !messages) {
        setMessages(defaultWelcomeChat);
      } else {
        setMessages(messages);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

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
        .eq("accountId", session!.user.id);

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
        .eq("accountId", session!.user.id);

      if (error) {
        console.error("Error updating free coin amount:", error.message);
      }
    }
    // @ts-ignore
    window.electron.startSync("main");
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
        className={`px-6 py-4 rounded-lg animate-pop-up ${
          role === CHAT_ROLE.USER
            ? isDarkMode
              ? "bg-blue-600 text-white" // Deep blue in dark mode
              : "bg-blue-500 text-white" // Vibrant blue in light mode
            : isDarkMode
            ? "bg-secondary text-white" // Darker gray for AI response in dark mode
            : "bg-gray-300 text-gray-900" // Light gray for AI response in light mode
        }`}
      >
        {message}
      </p>
    );
  };

  return (
    <div
      className={`h-screen flex flex-row  ${
        isDarkMode ? "bg-primary text-white" : "bg-lightBg text-black"
      } ${!isSidebarVisible ? "sidebar-hidden" : ""}`}
    >
      {/* Sidebar */}
      <div
        className={`sidebar-test h-screen fixed lg:relative flex flex-col 
    ${isDarkMode ? "bg-secondary text-white" : "bg-gray-900 text-white"} 
    p-4 transition-all duration-300
    ${isSidebarVisible ? "w-64 lg:w-1/5 z-10" : "hidden lg:w-1/5"}
  `}
      >
        <div className="flex justify-end">
          {/* New Chat Button */}
          <button
            className="p-2 rounded-lg hover:bg-gray-500 transition-all duration-200"
            onClick={handleCreateNewChat}
          >
            <ListPlus className="size-8" />
          </button>
        </div>

        {/* Chat History Section */}
        <div className="flex flex-col mt-4 flex-grow overflow-hidden font-thin">
          <h3 className="text-md font-semibold pb-2 border-b border-gray-700 ">
            Recent Chats
          </h3>

          <div className="overflow-y-auto flex-grow mt-2 space-y-2">
            {chatHistory.length > 0 ? (
              chatHistory.map((chat, index) => (
                <div key={index} className="flex justify-between">
                  <div
                    className="py-2 px-3 flex-grow rounded-lg cursor-pointer text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
                    onClick={() => loadChat(chat.id)}
                  >
                    <strong className="block truncate">{chat.title}</strong>
                  </div>
                  <button
                    className="py-2 px-3  rounded-lg  hover:bg-gray-700 hover:text-white transition-all duration-200"
                    onClick={async () => await clearChatHistory(chat.id)}
                  >
                    <Trash2 />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm mt-2">No history available</p>
            )}
          </div>
        </div>

        <button
          className="test-go-to-upgrade-btn mt-auto px-6 py-3 rounded-lg text-lg font-semibold border border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-300 bg-gray-200 dark:bg-transparent
            hover:bg-gray-300 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition duration-300 shadow-lg shadow-purple-500/30"
          onClick={goToUpgrade}
        >
          Upgrade Plan
        </button>
      </div>

      {/* Main Chat Area */}
      <div className={`flex flex-col p-4 w-full mx-auto`}>
        {/* Top row */}
        <div className="flex justify-between px-4  items-center">
          {/* Sidebar Toggle Button left side */}
          <button
            className="sidebar-toggle-button z-20 p-2 rounded-lg hover:bg-gray-500  hover:bg-opacity-80 transition-all duration-200"
            onClick={toggleSidebar}
          >
            {isSidebarVisible ? (
              <PanelRightOpen className="size-8" />
            ) : (
              <PanelRightClose className="size-8" />
            )}
          </button>
          {/* Right Side top row */}
          <div>
            <div className="flex items-center gap-8">
              <div className="flex gap-8">
                {isSubscriptionActive && (
                  <div className="relative group flex gap-2 items-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs md:text-sm bg-yellow-100 text-yellow-800 border border-yellow-300">
                      <Gem className="w-5 h-5 text-yellow-600" />
                      Premium User
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:flex items-center justify-center px-2 py-1 bg-gray-800 text-white text-sm rounded-lg ">
                      Your monthly Subscription is active
                    </div>
                  </div>
                )}
                {/* Token Balance Tooltip */}
                <div className="relative group flex gap-2 items-center">
                  <Coins className="free-coin text-yellow-400 size-8" />
                  <p className="text-md font-thin">{freeCoin.toFixed(2)}</p>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:flex items-center justify-center px-2 py-1 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap">
                    Daily Free Balance
                  </div>
                </div>

                {/* Wallet Balance Tooltip */}
                <div className="relative group flex gap-2 items-center">
                  <DollarSign className="wallet-coin text-yellow-400 size-8" />
                  <p className="text-md font-thin">{walletCoin.toFixed(2)}</p>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:flex items-center justify-center px-2 py-1 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap">
                    Your Wallet Balance
                  </div>
                </div>
              </div>

              <div className="relative">
                <button
                  className="profile-icon p-2 rounded-lg hover:bg-gray-500  hover:bg-opacity-80 transition-all duration-200"
                  onClick={toggleDropdown}
                >
                  <Settings2 className="size-8" />
                </button>

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
                        className={`test-go-to-settings-btn px-4 py-2 cursor-pointer ${
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
                        className={`logout-option px-4 py-2 cursor-pointer ${
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
        </div>
        {/* Chat Messages */}
        <div className="message-box flex-grow mx-auto w-full max-w-[800px] overflow-y-auto mt-10 scrollbar-hide font-light ">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === CHAT_ROLE.USER
                  ? "user-message justify-end"
                  : "system-message justify-start"
              } my-6`}
            >
              {handleLLMResponse(message.content, message.role)}
            </div>
          ))}

          <div ref={chatEndRef} />
        </div>

        <div
          className="pointer-events-auto mx-auto w-full max-w-[800px] mb-10 p-6 border rounded-2xl 
  bg-secondary text-gray-900 border-secondary shadow-md
  dark:bg-transparent dark:border-gray-500 dark:text-gray-300
  shadow-blue-300/30 dark:shadow-blue-500/40"
        >
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="chat-input h-12 flex-grow p-4 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Message Echo"
              />
              <button
                onClick={sendMessage}
                className="send-button px-2 py-2 text-xl bg-blue-500 rounded-lg hover:scale-110 hover:shadow-md hover:shadow-blue-500 transition-transform duration-300"
              >
                <IoIosSend />
              </button>
              <button
                onClick={handleRecord}
                className={`microphone-button px-2 py-2 text-xl rounded-lg ${
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
                className={`web-search-btn flex items-center gap-2 px-4 py-2 rounded-lg transition-transform duration-300 ${
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-transform duration-300  ${
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-transform duration-300  ${
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
