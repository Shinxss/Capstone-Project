/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lgu: {
          lightBg: "#F6F7F9",
          darkBg: "#060C18",
          shell: "#0B1220",
          card: "#0E1626",
          hover: "#122036",
          selected: "#0F1A2E",
          border: "#162544",
          badge: "#1B2A45",
          danger: "#DC2626",
        },
      },
    },
  },
  plugins: [],
};
