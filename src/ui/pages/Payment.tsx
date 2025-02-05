import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext"; // Import the useTheme hook

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme(); // Access the theme context

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
            Subscribe to AskVox Premium Subscription
          </h1>
          <p
            className={`text-4xl font-bold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            $10<span className="text-2xl font-normal"> per month</span>
          </p>
          <ul
            className={`list-none p-0 mb-6 ${
              isDarkMode ? "text-gray-400" : "text-gray-700"
            }`}
          >
            <li className="mb-2">
              <strong>Ask</strong>
              <span className="text-indigo-500">Vox</span> premium subscription
              <span className="float-right">$10.00</span>
            </li>
            <li className="text-sm mb-6">Billed monthly</li>
            <li className="mb-2">
              Subtotal<span className="float-right">$10.00</span>
            </li>
            <li className="mb-2">
              Gst(9%)<span className="float-right">$0.90</span>
            </li>
            <hr className="border-t border-gray-700 my-6" />
            <li className="text-lg font-semibold">
              Total due<span className="float-right">$10.90</span>
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
          <form>
            <div className="space-y-4">
              {/* Card Information */}
              <div
                className={`flex items-center border ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                } rounded-lg p-2`}
              >
                <input
                  type="text"
                  maxLength={16} // Limit card number to 16 digits
                  onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                    e.target.value = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
                  }}
                  placeholder="1234 1234 1234 1234"
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
                  className={`w-full p-3 border ${
                    isDarkMode
                      ? "border-gray-700 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-900"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                >
                  <option>Singapore</option>
                </select>
              </div>
              {/* Subscribe Button */}
              <button
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
