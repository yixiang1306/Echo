import { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export const fetchFreeCoin = async (session: Session): Promise<number> => {
  try {
    let { data: free_coin, error } = await supabase
      .from("FreeCoin")
      .select("amount")
      .eq("accountId", session.user.id)
      .single();
    if (error || !free_coin) {
      throw error;
    }
    return free_coin.amount as number;
  } catch (error) {
    console.error("Error fetching free coin", error);
    return 0;
  }
};

export const fetchWallet = async (session: Session): Promise<number> => {
  try {
    let { data: wallet, error } = await supabase
      .from("Wallet")
      .select("amount")
      .eq("accountId", session.user.id)
      .single();
    if (error || !wallet) {
      throw error;
    }
    return wallet.amount as number;
  } catch (error) {
    console.error("Error Fetching Wallet", error);
    return 0;
  }
};
