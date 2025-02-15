import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext"; // Import the useTheme hook
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../utility/supabaseClient";
import { useAuth } from "../utility/authprovider";
import { Session } from "@supabase/supabase-js";
import { X } from "lucide-react";

const Payment: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme(); // Access the theme context

  const GST = 0.09;
  const subscription_amount = 25;
  const total_amount = subscription_amount + subscription_amount * GST;
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    setCurrentSession(session);
  }, []);

  const handleComfirmPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    const cardInput = document.getElementById(
      "cardNumber"
    ) as HTMLInputElement | null;

    // Ensure input exists and extract digits safely
    const cardNumber = cardInput?.value.replace(/\D/g, "") || "";

    // Extract last 4 digits safely (fallback to empty string if input is too short)
    const lastFourDigits = cardNumber.length >= 4 ? cardNumber.slice(-4) : "";

    const cardHolderName = (
      document.getElementById("cardHolderName") as HTMLInputElement
    )?.value.trim();
    const billingAddress = (
      document.getElementById("billingAddress") as HTMLSelectElement
    )?.value;

    try {
      // Insert transaction record into Supabase
      const { error: TransactionError } = await supabase
        .from("Transaction")
        .insert([
          {
            id: uuidv4(),
            accountId: currentSession?.user.id,
            createdAt: new Date().toISOString(),
            type: "MONTHLY_SUBSCRIPTION",
            amount: total_amount,
            cardId: lastFourDigits,
            cardHolderName: cardHolderName,
            billingAddress: billingAddress,
          },
        ]);

      if (TransactionError)
        throw "Error inserting transaction:" + TransactionError.message;

      // subscription

      const currentExpiryDate = new Date();
      const newExpiryDate = new Date(
        currentExpiryDate.setMonth(currentExpiryDate.getMonth() + 1)
      ).toISOString();

      const { error: subscriptionError } = await supabase
        .from("Subscription")
        .update({
          expiredAt: newExpiryDate,
        })
        .eq("accountId", currentSession?.user.id);

      if (subscriptionError) {
        throw new Error(
          "Error updating Subscription: " + subscriptionError.message
        );
      }

      const { error: UserError } = await supabase
        .from("User")
        .update({
          userType: "MONTHLY_SUBSCRIPTION",
        })
        .eq("accountId", currentSession?.user.id);

      if (UserError) {
        throw new Error("Error updating user: " + UserError.message);
      }

      console.log("Payment successful! Your subscription is activated");
      setFeedbackMessage("Payment successful! Your subscription is activated");
      navigate("/app");
    } catch (error) {
      console.error("Payment error:", error);
      setFeedbackMessage("Payment error");
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-gray-100 dark:bg-primary text-gray-900 dark:text-white flex items-center justify-center transition-all duration-300">
      {/* Logo */}
      <div
        className="absolute top-5 left-10 text-2xl font-bold cursor-pointer drop-shadow-[0_0_10px_rgba(0,150,255,0.8)]"
        onClick={() => navigate("/app")}
      >
        <h1 className="dark:text-white text-gray-900 text-3xl">ECHO</h1>
      </div>

      {/* Close Button */}
      <div
        className="absolute top-5 right-5 text-3xl cursor-pointer text-gray-900 dark:text-gray-300 hover:text-red-500 transition duration-300"
        onClick={() => navigate("/app")}
      >
        <X className="size-10" />
      </div>

      <div
        className={`w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 ${
          isDarkMode ? "bg-secondary text-white" : "bg-white text-black"
        } p-8 rounded-lg shadow-lg`}
      >
        {/* Left Section: Subscription Details */}
        <div>
          {/* Feedback Message */}
          {feedbackMessage && (
            <div
              className={`test-response-message ${
                isDarkMode
                  ? "bg-gray-800 text-gray-200"
                  : "bg-green-100 text-green-700"
              } px-4 py-3 rounded-lg mb-4 w-full max-w-md`}
            >
              {feedbackMessage}
              <button
                onClick={() => setFeedbackMessage("")}
                className={`ml-4 ${
                  isDarkMode ? "text-gray-400" : "text-green-500"
                } hover:${isDarkMode ? "text-gray-200" : "text-green-700"}`}
              >
                &times;
              </button>
            </div>
          )}
          <div
            className={`flex items-center cursor-pointer mb-5 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <span
              className="text-2xl mr-2"
              onClick={() => navigate("/upgrade")}
            >
              &#8592;
            </span>
            <span
              className={`text-2xl font-bold ${
                isDarkMode ? "text-indigo-400" : "text-indigo-500"
              }`}
              onClick={() => navigate("/upgrade")}
            >
              ECHO
            </span>
          </div>
          <h1
            className={`text-3xl font-bold mb-6 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Subscribe to AskVox Premium Subscription
          </h1>
          <p
            className={`text-4xl font-bold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            $ {subscription_amount}
            <span className="text-2xl font-normal"> per month</span>
          </p>
          <ul
            className={`list-none p-0 mb-6 ${
              isDarkMode ? "text-gray-400" : "text-gray-700"
            }`}
          >
            <li className="mb-2">
              <strong>Ask</strong>
              <span className="text-indigo-500">Vox</span> premium subscription
              <span className="float-right">
                ${subscription_amount.toFixed(2)}
              </span>
            </li>
            <li className="text-sm mb-6">Billed monthly</li>
            <li className="mb-2">
              Subtotal
              <span className="float-right">
                ${subscription_amount.toFixed(2)}
              </span>
            </li>
            <li className="mb-2">
              Gst(9%)
              <span className="float-right">${subscription_amount * GST}</span>
            </li>
            <hr className="border-t border-gray-700 my-6" />
            <li className="text-lg font-semibold">
              Total due
              <span className="float-right">$ {total_amount}</span>
            </li>
          </ul>
        </div>
        {/* Right Section: Payment Method */}
        <div
          className={`p-6 border ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          } rounded-lg`}
        >
          <h2
            className={`text-2xl font-bold mb-6 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Payment method
          </h2>
          <form onSubmit={handleComfirmPayment}>
            <div className="space-y-4">
              {/* Card Information */}
              <div
                className={`flex items-center border ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                } rounded-lg p-2`}
              >
                <input
                  id="cardNumber"
                  required
                  type="text"
                  maxLength={19} // ✅ Allows formatted input (XXXX XXXX XXXX XXXX)
                  placeholder="1234 1234 1234 1234"
                  pattern="(\d{4} \d{4} \d{4} \d{4}|\d{16})" // ✅ Accepts both spaced & unspaced numbers
                  onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                    // Remove non-numeric characters
                    let value = e.target.value.replace(/\D/g, "");

                    // Format as "XXXX XXXX XXXX XXXX"
                    value = value.replace(/(\d{4})(?=\d)/g, "$1 ").trim();

                    // Update input value
                    e.target.value = value;
                  }}
                  className={`flex-1 p-2 bg-transparent ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  } outline-none focus:outline-none`}
                />

                <img
                  src="./mastercard.png" // Replace with the path to your image
                  alt="MasterCard"
                  className="w-8 h-8 ml-2"
                />
                <img
                  src="./visa.jpg" // Replace with the path to your image
                  alt="Visa"
                  className="w-8 h-8 ml-2"
                />
                <img
                  src="./amex.png" // Replace with the path to your image
                  alt="American Express"
                  className="w-8 h-8 ml-2"
                />
              </div>
              {/* Expiration Date */}
              <div
                className={`flex items-center border ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                } rounded-lg p-2`}
              >
                <input
                  id="cardExpiredDate"
                  required
                  type="text"
                  placeholder="MM/YY"
                  className={`flex-1 p-2 bg-transparent ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  } outline-none focus:outline-none`}
                />
              </div>
              {/* CVC */}
              <div
                className={`flex items-center border ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                } rounded-lg p-2`}
              >
                <input
                  id="cardCVC"
                  required
                  type="text"
                  placeholder="CVC"
                  className={`flex-1 p-2 bg-transparent ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  } outline-none focus:outline-none`}
                />
              </div>
              {/* Cardholder Name */}
              <div className="mb-6">
                <label
                  className={`block font-bold mb-2 ${
                    isDarkMode ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  Cardholder name
                </label>
                <input
                  id="cardHolderName"
                  required
                  type="text"
                  placeholder="Full name on card"
                  className={`w-full p-3 border ${
                    isDarkMode
                      ? "border-gray-700 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-900"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
              </div>
              {/* Billing Address */}
              <div className="mb-6">
                <label
                  className={`block font-bold mb-2 ${
                    isDarkMode ? "text-gray-400" : "text-gray-700"
                  }`}
                >
                  Billing address
                </label>
                <select
                  id="billingAddress"
                  className={`w-full p-3 border ${
                    isDarkMode
                      ? "border-gray-700 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-900"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                >
                  <option value={"Singapore"}>Singapore</option>
                </select>
              </div>
              {/* Subscribe Button */}
              <button
                type="submit"
                className={`w-full p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700`}
              >
                Subscribe
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Payment;
