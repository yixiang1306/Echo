import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutModal from "./LogoutModal";
import { supabase } from "../supabaseClient";
import { CircleCheckBig, CircleDollarSign, Wallet } from "lucide-react";

interface FetchDataType {
  firstName: string;
  lastName: string;
  userType: string;
}
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
  const [fetchData, setFetchData] = useState<FetchDataType | null>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [freeCoin, setFreeCoin] = useState(5.0);
  const [walletCoin, setWalletCoin] = useState(5.0);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);

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
        setFetchData(null);
        console.error("Error fetching user data:", error.message);
      } else {
        setFetchData(User);
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

  const sendAudio = async (audioBlob: Blob) => {
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

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      if (reader.result === null) return;

      const base64Audio = (reader.result as string).split(",")[1];

      try {
        //@ts-ignore
        const response = await window.electronAPI.sendAudio(base64Audio);
        setUserInput(response);

        setMessages((prev) => [...prev, { role: "user", content: response }]);
        // const test = {
        //   input: userInput,
        //   output: "Hey How can I Help you today?",
        // };
        // await calculateCost(test, MODEL_TYPE.ASKVOX);

        //@ts-ignore
        const llm_response = await window.electronAPI.textInput(response);
        const conversation_data = {
          input: userInput,
          output: String(llm_response),
        };
        await calculateCost(conversation_data, MODEL_TYPE.ASKVOX);

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: llm_response },
        ]);
        setUserInput("");
      } catch (error) {
        console.error("Error processing audio or sending message:", error);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error processing your request." },
        ]);
      } finally {
        setIsLoading(false);
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
    localStorage.removeItem("accountId"); // Remove from localStorage
    setIsModalVisible(false);
    window.location.href = "/";
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

  return (
    <div
      className={`flex h-screen ${!isSidebarVisible ? "sidebar-hidden" : ""}`}
    >
      <button
        className="fixed top-4 left-4 z-50 bg-transparent border-none cursor-pointer"
        onClick={toggleSidebar}
      >
        <img
          src={
            isSidebarVisible
              ? "/public/sidebar_open.png"
              : "/public/sidebar_close.png"
          }
          alt={isSidebarVisible ? "Close Sidebar" : "Open Sidebar"}
          className="w-8 h-8"
        />
      </button>

      <div
        className={`flex flex-col justify-between bg-gray-900 text-white p-4 transition-all duration-300 ${
          isSidebarVisible ? "w-1/5" : "hidden"
        }`}
      >
        <h2 className="pt-12 mb-4">History</h2>
        <ul className="space-y-4">
          <li>Composite bow stats</li>
          <li>How do I beat Battlemage</li>
          <li>How do I get to Abyssal Woods</li>
        </ul>
        <button
          onClick={goToUpgrade}
          className="mt-auto bg-purple-600 hover:bg-purple-700 text-white text-center py-2 px-4 rounded-lg"
        >
          Upgrade Plan
        </button>
      </div>

      <div className="flex-grow flex flex-col bg-gray-100 p-8 relative">
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
                src="/public/user.png"
                alt="Profile"
                className="w-8 h-8 rounded-full cursor-pointer"
                onClick={toggleDropdown}
              />
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg w-36">
                  <ul className="py-1 text-gray-700">
                    <li
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={goToSettings}
                    >
                      Settings
                    </li>
                    <li
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={goToUpgrade}
                    >
                      Upgrade Plan
                    </li>
                    <li
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
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

        {/* <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            Hi,{" "}
            <b>
              &lt;{fetchData?.firstName} {fetchData?.lastName}&gt;
            </b>
          </h1>
        </div> */}

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
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                } break-words whitespace-pre-wrap`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="max-w-xs px-4 py-2 rounded-lg shadow-md bg-gray-200 text-gray-800 animate-pulse">
                ...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="flex gap-4 sticky bottom-0 bg-gray-100 p-4">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask me anything"
            className="flex-grow px-4 py-2 border rounded-lg"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
          >
            Send
          </button>
          <button
            onClick={handleRecord}
            className={`py-2 px-4 rounded-lg ${
              isRecording ? "bg-red-600" : "bg-green-600"
            } hover:bg-blue-700`}
          >
            {isRecording ? "Stop" : "Record"}
          </button>
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
