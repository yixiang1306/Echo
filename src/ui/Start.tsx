import { useState } from "react";
import "./Start.css";


function Start({ onLogin }: { onLogin: () => void }) {
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      alert("Logged in successfully!");
      onLogin(); // Navigate to main app
    } else {
      alert("Account created successfully!");
      setIsLogin(true); // Switch back to login mode
    }
  };

  return (
    <div className="home-page">
      <h2>{isLogin ? "Log In" : "Sign Up"}</h2>
      <form onSubmit={handleSubmit}>
        <button type="submit">{isLogin ? "Log In" : "Sign Up"}</button>
      </form>
    </div>
  );
}

export default Start;




