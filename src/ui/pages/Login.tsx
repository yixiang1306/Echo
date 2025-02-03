import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../supabaseClient"; // Import Supabase client
import "./Login.css"; // Import the external CSS file

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState(""); // For error or info messages
  const [password, setPassword] = useState<string>("");

  //------------------ Function to update the daily active user count-------------------------
  async function updateDailyActiveUserCount(): Promise<boolean> {
    const today = new Date().toISOString().split("T")[0]; // Get today's date (ISO format)

    // Fetch if there's already a record for today
    const { data: existingRecord, error: fetchError } = await supabase
      .from("DailyActiveUser")
      .select("id, count")
      .eq("date", today);

    if (fetchError) {
      setMessage(`Failed to fetch existing record: ${fetchError.message}`);
      return false;
    }

    // If record exists, update the count; otherwise, create a new record
    if (existingRecord.length > 0) {
      const { error: updateError } = await supabase
        .from("DailyActiveUser")
        .update({ count: existingRecord[0].count + 1 })
        .eq("id", existingRecord[0].id);

      if (updateError) {
        setMessage(`Failed to update record: ${updateError.message}`);
        return false;
      }
    } else {
      // Insert a new record if none exists
      const { error: insertError } = await supabase
        .from("DailyActiveUser")
        .insert([{ date: today, count: 1 }]);

      if (insertError) {
        setMessage(`Failed to insert record: ${insertError.message}`);
        return false;
      }
    }
    return true; // Successfully updated or inserted the record
  }

  //---------------------- Function to mark a user as online------------------------------
  async function markUserAsOnline(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split("T")[0]; // Get today's date

    // Fetch the user's last active timestamp
    const { data: userStatus, error: fetchError } = await supabase
      .from("UserOnlineStatus")
      .select("lastActive")
      .eq("accountId", userId);

    if (fetchError) {
      setMessage(`Failed to fetch user last timestamp: ${fetchError.message}`);
      return false;
    }

    // Update or insert the online status record
    const { error: isOnlineStatusError } = await supabase
      .from("UserOnlineStatus")
      .upsert(
        {
          id: uuidv4(), // Unique ID for each record
          accountId: userId,
          lastActive: today,
          isOnline: true, // Mark user as online
        },
        { onConflict: "accountId" } // Use conflict resolution based on accountId
      );

    if (isOnlineStatusError) {
      setMessage(
        `Failed to update OnlineStatus: ${isOnlineStatusError.message}`
      );
      return false;
    }

    // If user was not active today, update daily active user count
    if (userStatus === null || userStatus.length === 0) {
      const dailyUpdateSuccess = await updateDailyActiveUserCount();
      if (!dailyUpdateSuccess) {
        return false;
      }
      return true;
    }
    return true; // User is already marked as active
  }

  //----------------------- Handle coin and subscription sync---------------------------------
  async function syncCoinsAndSubscriptions() {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("FreeCoin")
      .select("id,amount,updatedAt")
      .eq("accountId", localStorage.getItem("accountId"))
      .single();

    if (error) {
      console.error("Error fetching user free data:", error.message);
      return false;
    }

    const lastUpdate = data.updatedAt.split("T")[0];

    if (lastUpdate !== today) {
      const { error: updateError } = await supabase
        .from("FreeCoin")
        .update({
          amount: data.amount + 1,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (updateError) {
        console.error("Error updating user free data:", updateError.message);
        return false;
      }
    }

    const { data: user_type, error: user_type_error } = await supabase
      .from("User")
      .select("userType")
      .eq("accountId", localStorage.getItem("accountId"))
      .single();

    if (user_type_error) {
      console.error(
        "Error fetching userType from main user:",
        user_type_error.message
      );
      return false;
    }

    if (user_type.userType !== "MONTHLY_SUBSCRIPTION") {
      return true;
    }

    const { data: subscription_data, error: subscription_data_error } =
      await supabase
        .from("Subscription")
        .select("expiredAt")
        .eq("accountId", localStorage.getItem("accountId"))
        .single();

    if (subscription_data_error) {
      console.error(
        "Error fetching Subscription:",
        subscription_data_error.message
      );
      return false;
    }

    const expired_date = subscription_data.expiredAt.split("T")[0];

    if (expired_date < today) {
      const { data: wallet_data, error: wallet_data_error } = await supabase
        .from("Wallet")
        .select("amount")
        .eq("accountId", localStorage.getItem("accountId"))
        .single();

      if (wallet_data_error) {
        console.error("Error fetching Wallet:", wallet_data_error.message);
        return false;
      }
      if (wallet_data.amount <= 0) {
        const { error: updateUserTypeError } = await supabase
          .from("User")
          .update({
            userType: "FREE",
            updatedAt: new Date().toISOString(),
          })
          .eq("accountId", localStorage.getItem("accountId"));

        if (updateUserTypeError) {
          console.error(
            "Error updating FREE user type:",
            updateUserTypeError.message
          );
          return false;
        }
      } else {
        const { error: updateUserTypeError } = await supabase
          .from("User")
          .update({
            userType: "PAY_PER_USE",
            updatedAt: new Date().toISOString(),
          })
          .eq("accountId", localStorage.getItem("accountId"));

        if (updateUserTypeError) {
          console.error(
            "Error updating PAY_PER_USE user type:",
            updateUserTypeError.message
          );
          return false;
        }
      }
      return true;
    }
    return true;
  }

  //----------------------- Handle sign-in form submission---------------------------------
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload on form submit

    // Sign in with Supabase authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message); // Display error message
      return;
    }
    localStorage.setItem("accountId", data.user.id); // Store user ID in localStorage
    // Mark the user as online and update daily active user count
    const isMarkedOnline = await markUserAsOnline(data.user.id);
    if (!isMarkedOnline) {
      return;
    }
    const isSynced = await syncCoinsAndSubscriptions();
    if (!isSynced) {
      return;
    }
    navigate("/app"); // Redirect to the application page after successful login
  };

  return (
    <div className="login-container">
      <div className="logo" onClick={() => navigate("/")}>
        <span className="ask">Ask</span>
        <span className="vox">Vox</span>
      </div>

      <div className="login-card">
        <h1 className="login-title">Login Here</h1>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input-field"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input-field"
        />
        {message && <div className="error-message">{message}</div>}{" "}
        {/* Show error message if any */}
        <button onClick={handleSignIn} className="login-button">
          Login
        </button>
        <div className="divider">
          <span>------------ Or ------------</span>
        </div>
        <button onClick={() => navigate("/signup")} className="signup-button">
          Sign Up
        </button>
      </div>
    </div>
  );
}

export default Login;
