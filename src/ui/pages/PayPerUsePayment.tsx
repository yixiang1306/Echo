import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../utility/supabaseClient";
import { useAuth } from "../utility/authprovider";
import { Session } from "@supabase/supabase-js";

const PayPerUsePayment: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const GST = 0.09; // 9% GST
  const creditPrice = 1; // Each credit costs $1
  const [credits, setCredits] = useState(1); // Default to 1 credit
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  useEffect(() => {
    setCurrentSession(session);
  }, []);

  // Calculate the total amount dynamically
  const totalAmount = credits * creditPrice + credits * creditPrice * GST;

  const handleConfirmPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    const cardInput = document.getElementById(
      "cardNumber"
    ) as HTMLInputElement | null;
    const cardNumber = cardInput?.value.replace(/\D/g, "") || "";
    const lastFourDigits = cardNumber.length >= 4 ? cardNumber.slice(-4) : "";

    const cardHolderName = (
      document.getElementById("cardHolderName") as HTMLInputElement
    )?.value.trim();
    const billingAddress = (
      document.getElementById("billingAddress") as HTMLSelectElement
    )?.value;

    try {
      // Insert transaction record
      const { error: TransactionError } = await supabase
        .from("Transaction")
        .insert([
          {
            id: uuidv4(),
            accountId: currentSession?.user.id,
            createdAt: new Date().toISOString(),
            type: "PAY_PER_USE",
            amount: totalAmount,
            cardId: lastFourDigits,
            cardHolderName,
            billingAddress,
          },
        ]);

      if (TransactionError)
        throw new Error(
          "Error inserting transaction: " + TransactionError.message
        );

      const { error: CreditError } = await supabase.rpc(
        "increment_wallet_amount",
        {
          account_id: currentSession?.user.id, // Ensure it's a UUID (string format)
          amount_to_add: credits.toFixed(2), // Float value
        }
      );

      if (CreditError) {
        console.error("Failed to add credits:", CreditError.message);
      }

      alert(`Payment successful! You have added ${credits} credits.`);
      navigate("/app");
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"
      } p-4`}
    >
      <div
        className={`w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
        } p-8 rounded-lg shadow-lg`}
      >
        {/* Left Section: Subscription Details */}
        <div>
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
              Ask<span className="text-indigo-500">Vox</span>
            </span>
          </div>
          <h1
            className={`text-3xl font-bold mb-6 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Echo Credit Top up
          </h1>
          <p
            className={`text-4xl font-bold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            $ {creditPrice}
            <span className="text-2xl font-normal"> per credit</span>
          </p>
          {/* Credit Input */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2">
              How many credits do you want to top-up?
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={credits}
              onChange={(e) =>
                setCredits(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
            />
          </div>

          <ul
            className={`list-none p-0 mb-6 ${
              isDarkMode ? "text-gray-400" : "text-gray-700"
            }`}
          >
            <li className="mb-2">
              <strong>Ask</strong>
              <span className="text-indigo-500">Vox</span> Echo Top up
              <span className="float-right">${credits.toFixed(2)}</span>
            </li>
            <li className="text-sm mb-6">Billed monthly</li>
            <li className="mb-2">
              Subtotal
              <span className="float-right">${credits.toFixed(2)}</span>
            </li>
            <li className="mb-2">
              Gst(9%)
              <span className="float-right">${(credits * GST).toFixed(2)}</span>
            </li>
            <hr className="border-t border-gray-700 my-6" />
            <li className="text-lg font-semibold">
              Total due
              <span className="float-right">$ {totalAmount}</span>
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
          <form onSubmit={handleConfirmPayment}>
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

export default PayPerUsePayment;
