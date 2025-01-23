import React from "react";
import { useNavigate } from "react-router-dom";
const Payment: React.FC = () => {
    const navigate = useNavigate();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#f9fafb",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "1200px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "40px",
          background: "#fff",
          padding: "40px",
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Left Section: Subscription Details */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                fontSize: "16px",
                color: "#6b7280",
                marginRight: "8px",
              }}
            >
              &#8592;
            </span>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#000",
              }}
              onClick={() => navigate("/upgrade")}
            >
              Ask<span style={{ color: "#4f46e5" }}>Vox</span>
            </span>
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "20px",
              color: "#333",
            }}
          >
            Subscribe to AskVox Premium Subscription
          </h1>
          <p
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              marginBottom: "10px",
              color: "#000",
            }}
          >
            $10<span style={{ fontSize: "18px", fontWeight: "normal" }}> per month</span>
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: "0",
              marginBottom: "20px",
              color: "#6b7280",
            }}
          >
            <li style={{ marginBottom: "8px" }}>
              <strong>Ask</strong>
              <span style={{ color: "#4f46e5" }}>Vox</span> premium subscription
              <span style={{ float: "right", color: "#000" }}>$10.00</span>
            </li>
            <li style={{ fontSize: "12px", color: "#6b7280", marginBottom: "20px" }}>
              Billed monthly
            </li>
            <li style={{ marginBottom: "8px" }}>
              Subtotal<span style={{ float: "right", color: "#000" }}>$10.00</span>
            </li>
            <li style={{ marginBottom: "8px" }}>
              Gst(9%)<span style={{ float: "right", color: "#000" }}>$0.90</span>
            </li>
            <hr style={{ borderTop: "1px solid #e5e7eb", margin: "20px 0" }} />
            <li style={{ fontSize: "16px", fontWeight: "bold" }}>
              Total due<span style={{ float: "right", color: "#000" }}>$10.90</span>
            </li>
          </ul>
        </div>

        {/* Right Section: Payment Method */}
        <div
          style={{
            padding: "20px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              marginBottom: "20px",
              color: "#333",
            }}
          >
            Payment method
          </h2>
          <form>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "400px" }}>
            {/* Card Information */}
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px" }}>
                <input
                    type="text"
                    maxLength={16} // Limit card number to 16 digits
                    onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
                    }}
                    placeholder="1234 1234 1234 1234"
                    style={{
                    border: "none",
                    outline: "none",
                    flex: "1",
                    fontSize: "16px",
                    color: "#374151",
                }}
             />
                <img
                    src="/public/mastercard.png" // Replace with the path to your image
                    alt="Visa"
                    style={{ width: "30px", height: "auto", marginRight: "10px", backgroundColor:"rgba(0, 0, 0, 0.67)"}}/>
                <img
                    src="/public/visa.jpg" // Replace with the path to your image
                    alt="Visa"
                    style={{ width: "30px", height: "auto", marginRight: "10px" ,border: "1px solid #e5e7eb"}}/>
                <img
                    src="/public/amex.png" // Replace with the path to your image
                    alt="Visa"
                    style={{ width: "30px", height: "auto", marginRight: "0px" }}/>
            </div>

            {/* Expiration Date */}
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px" }}>
                <input
                    type="text"
                    placeholder="MM/YY"
                    style={{
                    border: "none",
                    outline: "none",
                    flex: "1",
                    fontSize: "16px",
                    color: "#374151",
                }}
            />
            </div>

            {/* CVC */}
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px" }}>
                <input
                    type="text"
                    placeholder="CVC"
                    style={{
                    border: "none",
                    outline: "none",
                    flex: "1",
                    fontSize: "16px",
                    color: "#374151",
                }}
            />
            </div>
</div>


            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  color: "#6b7280",
                }}
              >
                Cardholder name
              </label>
              <input
                type="text"
                placeholder="Full name on card"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  color: "#6b7280",
                }}
              >
                Billing address
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                }}
              >
                <option>Singapore</option>
              </select>
            </div>

            <button
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                backgroundColor: "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Payment;
