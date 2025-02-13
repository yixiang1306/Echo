import { Session } from "@supabase/supabase-js";
import { USER_TYPE } from "./enum";
import { supabase } from "./supabaseClient";

export const fetchUserType = async (
  session: Session
): Promise<USER_TYPE | null> => {
  try {
    let { data: User, error } = await supabase
      .from("User")
      .select("userType")
      .eq("accountId", session.user.id)
      .single();

    if (error || !User) {
      throw error;
    }
    return User.userType;
  } catch (error) {
    console.error("Error Fetching User Type", error);
    return null;
  }
};
