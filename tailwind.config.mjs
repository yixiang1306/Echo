/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#121212", // Dark background
        secondary: "#1e1e1e",
        accent: "#4a90e2",
        lightBg: "#ffffff", // Light mode background
        lightText: "#333333",
      },
      animation: {
        pulseEffect: "pulseEffect 2s infinite",
      },
      keyframes: {
        pulseEffect: {
          "0%, 100%": { opacity: 0.7, transform: "scale(1)" },
          "50%": { opacity: 1, transform: "scale(1.1)" },
        },
      },
    },
  },
  plugins: [require('tailwind-scrollbar-hide')],
};
