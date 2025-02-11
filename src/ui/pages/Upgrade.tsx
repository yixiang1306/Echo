import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext"; // Import the useTheme hook
import { useState, useEffect } from "react";
import { useAuth } from "../utility/authprovider";
import { supabase } from "../utility/supabaseClient";
import { Session } from "@supabase/supabase-js";

const Upgrade: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme(); // Get the current theme

  const [isSubscriptionActive, setIsSubscriptionActive] =
    useState<boolean>(false);

  useEffect(() => {
    const fetchUserType = async () => {
      let { data: User, error } = await supabase
        .from("User")
        .select("userType")
        .eq("accountId", session?.user.id)
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
    fetchUserType();
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-6 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      {/* Logo */}
      <div
        className="absolute top-6 left-10 cursor-pointer text-4xl font-bold"
        onClick={() => navigate("/app")}
      >
        <span className={isDarkMode ? "text-indigo-400" : "text-black"}>
          Ask
        </span>
        <span className="text-indigo-500">Vox</span>
      </div>

      {/* Header */}
      <h1 className="test-plan-choose-header text-4xl font-extrabold mb-12 text-center">
        Choose Your Plan
      </h1>

      {/* Plans Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl w-full">
        {/* Free Plan */}
        <div
          className={`border rounded-2xl shadow-lg text-center p-8 flex flex-col items-center ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <h2 className="test-free-plan text-2xl font-bold mb-3">Free Plan</h2>
          <p className="test-free-plan-price text-4xl font-bold">$0</p>
          <ul className="text-sm mt-6 space-y-3 text-left">
            <li className="flex items-center gap-2">
              <Check /> <p>Auto-renew: $1 credit per day</p>
            </li>
            <li className="flex items-center gap-2">
              <Check /> <p>Wake-up Command</p>
            </li>
            <li className="flex items-center gap-2">
              <Check /> <p>Text Generation</p>
            </li>
            <li className="flex items-center gap-2">
              <Check /> <p>Web Search</p>
            </li>
            <li className="flex items-center gap-2">
              <Check /> <p>Multimedia Generation</p>
            </li>
            <li className="flex items-center gap-2">
              <Check /> <p>Voice Input & Response</p>
            </li>
            <li className="flex items-center gap-2">
              <Check /> <p>Overlay Screen</p>
            </li>
          </ul>

          <button
            className={`test-free-plan-btn mt-5 w-full py-3 px-6 rounded-full text-lg font-medium ${
              isDarkMode
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-600 cursor-not-allowed"
            }`}
            disabled
          >
            Free Plan is Active
          </button>
        </div>

        {/* Premium Plan */}
        <div
          className={`border rounded-2xl shadow-lg text-center p-8 flex flex-col items-center ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <h2 className="test-premium-plan text-2xl font-bold mb-3">
            Premium Plan
          </h2>
          <p className="test-premium-plan-price text-4xl font-bold">
            $25<span className="text-base font-normal">/month</span>
          </p>
          <ul className="text-sm mt-6 space-y-2 text-left">
            <li className="flex items-center gap-2">
              <Check /> <p>Includes all Free Plan features</p>
            </li>
            <li className="flex items-center gap-2">
              <Check /> <p>Unlimited requests throughout the month</p>
            </li>
            <li className="flex items-center gap-2">
              <Check /> <p>Best option for long-term use</p>
            </li>
          </ul>
          <button
            className={`test-premium-plan-btn mt-auto w-full py-3 px-6 rounded-full text-lg font-medium ${
              isDarkMode
                ? "bg-indigo-700 hover:bg-indigo-800 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            } ${isSubscriptionActive ? "opacity-50 cursor-not-allowed" : ""}`} // ✅ Add styles for disabled state
            disabled={isSubscriptionActive} // ✅ Correct way to disable button
            onClick={() => {
              if (!isSubscriptionActive) {
                navigate("/payment");
              }
            }}
          >
            {isSubscriptionActive
              ? "Subscription is Active"
              : "Upgrade to Premium"}
          </button>
        </div>

        {/* Pay Per Use Plan */}
        <div
          className={`border rounded-2xl shadow-lg text-center p-8 flex flex-col items-center ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <h2 className="test-payperuse-plan text-2xl font-bold mb-3">
            Pay Per Use
          </h2>
          <p className="test-payperuse-plan-price text-4xl font-bold">
            $1<span className="text-base font-normal">/1 credit</span>
          </p>
          <ul className="text-sm mt-6 space-y-2 text-left">
            <li className="flex items-center gap-2">
              <Check /> <p>Top up credit as needed</p>
            </li>
            <li className="flex items-center gap-2">
              <Check /> <p>No monthly commitment</p>
            </li>
            <li className="flex items-center gap-2">
              <Check /> <p>1 token ~ 4 characters</p>
            </li>
            <li className="flex items-center gap-2">
              <Check /> <p>$0.003/1000 tokens for input</p>
            </li>
            <li className="flex items-center gap-2">
              <Check /> <p>$0.015/1000 tokens for cache input</p>
            </li>
            <li className="flex items-center gap-2">
              <Check /> <p>$0.006/1000 tokens for output</p>
            </li>
            <li className="flex items-center gap-2">
              <Check /> <p>Best option for short-term use</p>
            </li>
          </ul>

          <button
            onClick={() => navigate("/pay_per_use_payment")}
            className={`test-payperuse-plan-btn mt-auto w-full py-3 px-6 rounded-full text-lg font-medium ${
              isDarkMode
                ? "bg-teal-700 hover:bg-teal-800 text-white"
                : "bg-teal-500 hover:bg-teal-600 text-white"
            }`}
          >
            Buy Tokens
          </button>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
