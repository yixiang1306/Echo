import { useState } from "react";
import "./Start.css";

/*
function Start({ onLogin }: { onLogin: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      // Simulate login check
      if (username === "user" && password === "password") {
        onLogin(); // If successful, trigger login
      } else {
        alert("Invalid login credentials");
      }
    } else {
      // Simulate sign-up logic
      if (username && email && password) {
        alert("Account created successfully!");
        setIsLogin(true); // Switch back to login
      } else {
        alert("Please fill in all fields");
      }
    }
  };

  return (
    <div className="home-page">
      <h2>{isLogin ? "Log In" : "Sign Up"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        {!isLogin && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{isLogin ? "Log In" : "Sign Up"}</button>
      </form>
      <p>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="toggle-btn"
        >
          {isLogin ? "Sign Up" : "Log In"}
        </button>
      </p>
    </div>
  );
}

export default Start;

*/


// FOR FRONT END USE ONLY, HARDCODED USER AND PW
function Start({ onLogin }: { onLogin: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Hardcoded credentials
  const hardcodedUser = {
    username: "user",
    password: "password",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      // Check hardcoded login credentials
      if (username === hardcodedUser.username && password === hardcodedUser.password) {
        alert("Login successful!");
        onLogin(); // Navigate to the main app
      } else {
        alert("Invalid login credentials");
      }
    } else {
      // Simulate successful sign-up
      if (username && password) {
        alert("Account created successfully!");
        setIsLogin(true); // Switch back to login mode
      } else {
        alert("Please fill in all fields");
      }
    }

    // Clear input fields
    setUsername("");
    setPassword("");
  };

  return (
    <div className="home-page">
      <h2>{isLogin ? "Log In" : "Sign Up"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{isLogin ? "Log In" : "Sign Up"}</button>
      </form>
      <p>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="toggle-btn"
        >
          {isLogin ? "Sign Up" : "Log In"}
        </button>
      </p>
    </div>
  );
}

export default Start;