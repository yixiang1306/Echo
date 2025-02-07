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
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const { session } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  interface ChatHistoryItem {
    id: string;
    title: string;
    created_at: string;
    preview: string;
  }

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

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!currentSession) return;
  
      try {
        // Fetch all chats for the current user
        const { data: chats, error: chatsError } = await supabase
          .from("chats")
          .select("id, title, created_at")
          .eq("user_id", currentSession.user.id)
          .order("created_at", { ascending: false });
  
        if (chatsError) {
          console.error("Error fetching chat history:", chatsError.message);
          return;
        }
  
        // For each chat, fetch the latest message preview
        const chatsWithPreview = await Promise.all(
          chats.map(async (chat) => {
            const { data: messages, error: messagesError } = await supabase
              .from("messages")
              .select("content")
              .eq("chat_id", chat.id)
              .order("created_at", { ascending: false })
              .limit(1);
  
            if (messagesError) {
              console.error("Error fetching chat messages:", messagesError.message);
              return { ...chat, preview: "No messages" };
            }
  
            return { ...chat, preview: messages[0]?.content || "No messages" };
          })
        );
  
        setChatHistory(chatsWithPreview);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };
  
    fetchChatHistory();
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
    if (userInput.trim() === "") return;
  
    // Add user message to local state
    const userMessage = { role: "user", content: userInput };
    setMessages((prev) => [...prev, userMessage]);
  
    // Check if the user has enough coins
    if (!isSubscriptionActive && freeCoin <= 0 && walletCoin <= 0) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, you do not have enough coins. Please purchase a subscription or top up your wallet.",
        },
      ]);
      return;
    }
  
    setIsLoading(true);
  
    try {
      // Insert user message into Supabase
      await saveMessagesToSupabase(userInput);
  
      // Send the user input to the Electron API for processing
      //@ts-ignore
      const response = await window.electronAPI.textInput(userInput);
  
      // Add assistant message to local state
      const assistantMessage = { role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMessage]);
  
      // Insert assistant message into Supabase
      await saveMessagesToSupabase(response, "assistant");
  
      // Calculate the cost of the conversation
      const conversation_data = {
        input: userInput,
        output: String(response),
      };
      await calculateCost(conversation_data, MODEL_TYPE.ASKVOX);
  
      // to implement chat title
      /*
      // Update the chat title if this is the first message
      if (messages.length === 1) {
        const generatedTitle = generateChatTitle(userInput);
        await updateChatTitle(activeChatId!, generatedTitle);
      } */
  
      setUserInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "Vox", content: "Error processing your request." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessagesToSupabase = async (content: string, role: string = "user") => {
    if (!currentSession || !activeChatId) return;
  
    try {
      await supabase.from("messages").insert([
        { chat_id: activeChatId, user_id: currentSession.user.id, role, content },
      ]);
    } catch (error) {
      console.error("Error saving message to Supabase:", error);
    }
  };

  // to implement chat title
  /*
  const generateChatTitle = (message: string): string => {
    const maxLength = 30; // Maximum length of the title
    const trimmedMessage = message.trim();
  
    if (trimmedMessage.length <= maxLength) {
      return trimmedMessage;
    }
  
    // Extract the first few words
    const words = trimmedMessage.split(" ");
    const truncatedWords = words.slice(0, 5); // Take the first 5 words
    return truncatedWords.join(" ") + "...";
  };

  const updateChatTitle = async (chatId: string, newTitle: string) => {
    if (!currentSession) return;
  
    try {
      // Update the chat title in Supabase
      const { error } = await supabase
        .from("chats")
        .update({ title: newTitle })
        .eq("id", chatId);
  
      if (error) {
        console.error("Error updating chat title:", error.message);
        return;
      }
  
      // Update the chat title in the local state
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        )
      );
    } catch (error) {
      console.error("Error updating chat title:", error);
    }
  };  */

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

  //------------------ Function Sign out   ------------------------

  const handleCleanupSession = async () => {
    try {
      // Step 1: Kill Electron windows (if applicable)
      try {
        //@ts-ignore
        await window.electron.killWindows();
        console.log("Electron windows killed successfully.");
      } catch (error) {
        console.error("Error killing Electron windows:", error);
      }
  
      // Step 2: Mark the user as offline
      try {
        if (currentSession) {
          await markUserAsOffline(currentSession.user.id);
          console.log("User marked as offline.");
        }
      } catch (error) {
        console.error("Error marking user as offline:", error);
      }
  
      // Step 3: Sign out from Supabase
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Error signing out from Supabase:", error.message);
        } else {
          console.log("User signed out successfully.");
        }
      } catch (error) {
        console.error("Error during Supabase sign-out:", error);
      }
  
      // Step 4: Clear Supabase auth tokens from storage
      try {
        localStorage.removeItem("supabase.auth.token");
        sessionStorage.removeItem("supabase.auth.token");
        console.log("Supabase auth tokens cleared from storage.");
      } catch (error) {
        console.error("Error clearing Supabase auth tokens:", error);
      }
  
      // Step 5: Hide the logout modal
      setIsModalVisible(false);
    } catch (error) {
      console.error("Unexpected error during logout cleanup:", error);
    }
  };

  const handleLogout = async () => {
    setIsModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    if (!currentSession) {
      console.error("No active session found. Cannot log out.");
      return;
    }
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
    navigate("/settings", { state: { userId: currentSession?.user.id } });
  };

  const startNewChat = async () => {
    if (!currentSession) return;
  
    try {
      const { data: newChat, error } = await supabase
        .from("chats")
        .insert([{ user_id: currentSession.user.id }])
        .select();
  
      if (error) {
        console.error("Error creating new chat:", error.message);
        return;
      }
  
      setMessages([{ role: "Vox", content: "Hello! How can I assist you today?" }]);
      setActiveChatId(newChat[0].id); // Set the new chat as active
      setChatHistory((prev) => [
        { id: newChat[0].id, title: "New Chat", preview: "No messages", created_at: new Date().toISOString() },
        ...prev,
      ]);
    } catch (error) {
      console.error("Error starting new chat:", error);
    }
  };

  const clearChatHistory = async () => {
    if (!currentSession) return;
    try {
      // Delete all chats for the current user
      const { error } = await supabase
        .from("chats")
        .delete()
        .eq("user_id", currentSession.user.id);
  
      if (error) {
        console.error("Error clearing chat history:", error.message);
        return;
      }
  
      // Reset local state
      setChatHistory([]);
      setMessages([{ role: "Vox", content: "Hello! How can I assist you today?" }]);
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  };

  const loadChat = async (chatId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from("messages")
        .select("role, content")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
  
      if (error) {
        console.error("Error loading chat messages:", error.message);
        return;
      }
  
      setMessages(messages);
      setActiveChatId(chatId); // Set the active chat ID
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
            <img
              src="/public/new_chat.png"
              alt="Start New Chat"
              className="w-6 h-6"
            />
          </button>

          {/* Chat History */}
          <div className="chat-history">
            <h3 className="pb-4">History</h3>
            {chatHistory.length > 0 ? (
              chatHistory.map((chat, index) => (
                <div
                  key={index}
                  className="chat-item"
                  onClick={() => loadChat(chat.id)} // Load chat when clicked
                >
                  <strong className="hover:text-blue-500">{chat.title}</strong>
                  
                </div>
              ))
            ) : (
              <p>No history available</p>
            )}
          </div>

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
        } p-8 relative max-w-[60%] mx-auto`}
      >
        {/* Dropdown Menu */}
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-8">
            <div className="flex gap-8">
              {/* Token Balance Tooltip */}
              <div className="relative group flex gap-2 items-center">
                <CircleDollarSign className=" size-8 text-yellow-400" />
                <p className="text-xl">{freeCoin.toFixed(4)}</p>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:flex items-center justify-center px-2 py-1 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap">
                  Daily Free Balance
                </div>
              </div>

              {/* Wallet Balance Tooltip */}
              <div className="relative group flex gap-2 items-center">
                <Wallet className="size-8 text-blue-400" />
                <p className="text-xl">{walletCoin.toFixed(4)}</p>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:flex items-center justify-center px-2 py-1 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap">
                  Your Wallet Balance
                </div>
              </div>
              {isSubscriptionActive && (
                <div className="relative group flex gap-2 items-center">
                  <CircleCheckBig className="size-8 text-green-600" />
                  <p className="text-xl"></p>
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
        <div className="flex-1 overflow-y-auto mt-6 scrollbar-hide">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } my-4`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg shadow-md ${
                  message.role === "user"
                    ? isDarkMode
                      ? "bg-blue-700 text-white"
                      : "bg-blue-500 text-white"
                    : isDarkMode
                    ? "bg-gray-700 text-gray-200"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div
                className={`max-w-xs px-4 py-2 rounded-lg shadow-md ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-200"
                    : "bg-gray-200 text-gray-800"
                } animate-pulse`}
              >
                ...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* User Input */}
        <div className="relative w-full">
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
              <img src="/send.png" alt="Send" className="h-6 w-6" />
            </button>
            <button onClick={handleRecord} className="p-1 rounded-lg">
              <img
                src={isRecording ? "/red_mic.png" : "/blacked_mic.png"}
                alt={isRecording ? "Stop Recording" : "Start Recording"}
                className="h-6 w-6"
              />
            </button>
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
