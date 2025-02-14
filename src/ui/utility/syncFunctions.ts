import { supabase } from "./supabaseClient";
import { v4 as uuidv4 } from "uuid";

export async function markUserAsOnline(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];

  const { data: userStatus, error: fetchError } = await supabase
    .from("UserOnlineStatus")
    .select("lastActive")
    .eq("accountId", userId);

  if (fetchError) {
    console.error(`Failed to fetch user last timestamp: ${fetchError.message}`);
    return false;
  }

  const { error: isOnlineStatusError } = await supabase
    .from("UserOnlineStatus")
    .upsert(
      {
        id: uuidv4(),
        accountId: userId,
        lastActive: today,
        isOnline: true,
      },
      { onConflict: "accountId" }
    );

  if (isOnlineStatusError) {
    console.error(
      `Failed to update OnlineStatus: ${isOnlineStatusError.message}`
    );
    return false;
  }

  if (!userStatus || userStatus.length === 0) {
    return await updateDailyActiveUserCount();
  }

  return true;
}

async function updateDailyActiveUserCount(): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];

  const { data: existingRecord, error: fetchError } = await supabase
    .from("DailyActiveUser")
    .select("id, count")
    .eq("date", today);

  if (fetchError) {
    console.error(`Failed to fetch existing record: ${fetchError.message}`);
    return false;
  }

  if (existingRecord.length > 0) {
    const { error: updateError } = await supabase
      .from("DailyActiveUser")
      .update({ count: existingRecord[0].count + 1 })
      .eq("id", existingRecord[0].id);

    return !updateError;
  } else {
    const { error: insertError } = await supabase
      .from("DailyActiveUser")
      .insert([{ date: today, count: 1 }]);

    return !insertError;
  }
}

export async function syncCoinsAndSubscriptions(userId: string) {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("FreeCoin")
    .select("id, amount, updatedAt")
    .eq("accountId", userId)
    .single();

  if (error) {
    console.log(" error", error);
    return false;
  }

  const lastUpdate = data.updatedAt.split("T")[0];

  if (lastUpdate !== today) {
    const newAmount = Math.min(data.amount + 1, 1);
    if (newAmount !== data.amount) {
      const { error: updateError } = await supabase
        .from("FreeCoin")
        .update({
          amount: newAmount,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (updateError) {
        console.log("update error", updateError);
        return false;
      }
    }
  }

  const { data: userTypeData, error: userTypeError } = await supabase
    .from("User")
    .select("userType")
    .eq("accountId", userId)
    .single();

  if (userTypeError) {
    console.log("userTypeError error", userTypeError);
    return false;
  }

  if (userTypeData.userType !== "MONTHLY_SUBSCRIPTION") return true;

  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from("Subscription")
    .select("expiredAt")
    .eq("accountId", userId)
    .single();

  if (subscriptionError) {
    console.log("subscriptionError error", subscriptionError);
    return false;
  }

  const expiredDate = subscriptionData.expiredAt.split("T")[0];

  if (expiredDate < today) {
    const { data: walletData, error: walletError } = await supabase
      .from("Wallet")
      .select("amount")
      .eq("accountId", userId)
      .single();

    if (walletError) {
      console.log(walletError);
      return false;
    }

    const newType = walletData.amount <= 0 ? "FREE" : "PAY_PER_USE";

    const { error: updateTypeError } = await supabase
      .from("User")
      .update({ userType: newType, updatedAt: new Date().toISOString() })
      .eq("accountId", userId);

    return !updateTypeError;
  }

  return true;
}

export async function markUserAsOffline(accountId: string) {
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
}
