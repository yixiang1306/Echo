import { Session } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { CiGlobe, CiImageOn } from "react-icons/ci";
import { FaMicrophone, FaYoutube } from "react-icons/fa";
import { IoIosSend } from "react-icons/io";
import { useAuth } from "../utility/authprovider";
import { fetchChatHistory } from "../utility/chatFunctions";
import { CHAT_ROLE, MODEL_TYPE, USER_TYPE } from "../utility/enum";
import { supabase } from "../utility/supabaseClient";
import { fetchFreeCoin, fetchWallet } from "../utility/transcationFunctions";
import { fetchUserType } from "../utility/userFunctions";
import { defaultWelcomeChat } from "./ApplicationUI";

const ApplicationSideBarUI = () => {
  const [messages, setMessages] = useState(defaultWelcomeChat);
  const [userInput, setUserInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [messageTag, setMessageTag] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [freeCoin, setFreeCoin] = useState(0.0);
  const [walletCoin, setWalletCoin] = useState(0.0);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const { session } = useAuth();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const checkChatHistory = async (session: Session) => {
    if (!session) return;
    const chats = await fetchChatHistory(session);

    if (chats?.length === 0 || !chats) {
      setMessages(defaultWelcomeChat);
      setActiveChatId(null);
    } else {
      await loadChat(chats[0].id);
    }
  };

  useEffect(() => {
    if (!session) return;

    checkSubscriptionStatus(session);
    checkUserMoney(session);
    checkChatHistory(session);
  }, [session]);

  // Scroll to the latest message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

      setActiveChatId(newChat.id);
      await loadChat(newChat.id);
      console.log("active fron start", newChat.id);
      return newChat.id; // Return new chat ID
    } catch (error) {
      console.error("Error starting new chat:", error);
      return null;
    }
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
  };

  // Handle text message submission
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
      let aiResponse = "";
      await saveMessagesToSupabase(chatId, userInput, CHAT_ROLE.USER);

      // Send the message via Electron API
      //@ts-ignore
      window.llmAPI.sendText(taggedMessage, "sidebar");

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
        window.llmAPI.sendText(response, "sidebar");

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
              message.role === CHAT_ROLE.USER ? "justify-end" : "justify-start"
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
