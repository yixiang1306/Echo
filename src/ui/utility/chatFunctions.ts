import { Session } from "@supabase/supabase-js";
import { ChatHistoryItem } from "../pages/ApplicationUI";
import { supabase } from "./supabaseClient";

export const fetchChatHistory = async (
  session: Session
): Promise<ChatHistoryItem[] | null> => {
  if (!session) {
    console.error("No sesion found");
    return null;
  }
  try {
    // Fetch all chats for the current user
    const { data: chats, error: chatsError } = await supabase
      .from("ChatHistory")
      .select("id, title, createdAt")
      .eq("accountId", session.user.id)
      .order("createdAt", { ascending: false });

    if (chatsError) {
      throw chatsError;
    }
    return chats;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return null;
  }
};
