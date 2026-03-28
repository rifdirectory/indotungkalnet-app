/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0a84ff",
        secondary: "#5e5ce6",
        success: "#30d158",
        danger: "#ff453a",
        warning: "#ffd60a",
      }
    },
  },
  plugins: [],
}
