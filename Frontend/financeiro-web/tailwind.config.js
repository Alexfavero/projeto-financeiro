/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2a78d6",
          dark: "#184f95",
        },
        surface: {
          DEFAULT: "#fcfcfb",
          alt: "#f4f6f8",
        },
        border: "#e3e5e8",
        ink: {
          DEFAULT: "#0b0b0b",
          secondary: "#52514e",
          muted: "#8b8a85",
        },
        good: "#0ca30c",
        warning: "#fab219",
        critical: "#d03b3b",
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
