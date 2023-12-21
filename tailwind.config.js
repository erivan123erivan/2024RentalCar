/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        custom: ["Uberfontdeux", "sans-serif"],
        customs: ["Uberfont", "sans-serif"],
      },
      fontSize: {
        sms: "13px",
        lg: "16px",
        xl: "19px",
        md:"13px",
        sm:"13px",
        // Add more font size variants as needed
      },
      colors: {
        primary: "#ff0000",
        secondary: "#00ff00",
        // Add more custom colors as needed
      },
    },
  },
  plugins: [],
}

