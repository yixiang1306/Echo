import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutModal from "./LogoutModal";
import { supabase } from "../supabaseClient";
import { CircleCheckBig, CircleDollarSign, Wallet } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

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
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [freeCoin, setFreeCoin] = useState(5.0);
  const [walletCoin, setWalletCoin] = useState(5.0);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [chatHistory, setChatHistory] = useState<string[]>([
    "Composite bow stats",
    "How do I beat Battlemage",
    "How do I get to Abyssal Woods",
  ]);

  //------------------ Function the current session and resize handler -------------------------
  useEffect(() => {
    // Fetch the current session
    const fetchSession = async () => {
      const currentSession = await supabase.auth.getSession();
      setCurrentSession(currentSession);
      if (currentSession.data.session) {
        console.log("session", currentSession.data.session.user.id);
      }
    };

    fetchSession();
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
        .eq("accountId", currentSession.data.session.user.id)
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
        .eq("accountId", currentSession.data.session.user.id)
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
        .eq("accountId", currentSession.data.session.user.id)
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
    if (userInput.trim() === "") return;

    setMessages((prev) => [...prev, { role: "user", content: userInput }]);

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
    //-------------for testing--------------
    // const test = {
    //   input: userInput,
    //   output: "Hey How can I Help you today?",
    // };
    // await calculateCost(test, MODEL_TYPE.ASKVOX);

    try {
      //@ts-ignore
      const response = await window.electronAPI.textInput(userInput);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
      const conversation_data = {
        input: userInput,
        output: String(response),
      };
      await calculateCost(conversation_data, MODEL_TYPE.ASKVOX);
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

  //------------------ Function Sign out   -------------------------

  const markUserAsOffline = async (accountId: string) => {
    const todayDate = new Date().toISOString().split("T")[0];
    const { error } = await supabase
      .from("UserOnlineStatus")
      .update({
        isOnline: false,
        lastActive: todayDate,
      })
      .eq("accountId", accountId);

    if (error) {
      return false;
    }

    return true;
  };

  const handleCleanupSession = async () => {
    const res = await markUserAsOffline(currentSession.data.session.user.id);
    if (!res) {
      return;
    }
    await supabase.auth.signOut();
    localStorage.removeItem("accountId");
    setIsModalVisible(false);
    navigate("/");
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

  const clearChatHistory = () => {
    setChatHistory([]);
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
        .eq("accountId", currentSession.data.session.user.id);

      if (error) {
        console.error("Error updating free coin amount:", error.message);
      }
    } else if (walletCoin > 0) {
      const newAmount = freeCoin - parseFloat(costData.totalCost);
      console.log("updated amount from Wallet", newAmount);
      setWalletCoin(newAmount);
      const { error } = await supabase
        .from("Wallet")
        .update({
          amount: newAmount,
          updatedAt: new Date().toISOString(),
        })
        .eq("accountId", currentSession.data.session.user.id);

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
