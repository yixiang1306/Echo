import { supabase } from "../utility/supabaseClient";

export const clearChatHistory = async (userId: string) => {
  try {
    // Delete all chats for the user
    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("user_id", userId);
    if (error) {
      console.error("Error clearing chat history:", error.message);
      throw error;
    }
    console.log("Chat history cleared successfully.");
  } catch (error) {
    console.error("Error clearing chat history:", error);
    throw error;
  }
};