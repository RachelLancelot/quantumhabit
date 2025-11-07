import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4A90E2",
          dark: "#3A7BC8",
        },
        secondary: {
          DEFAULT: "#7B68EE",
          dark: "#6B58DE",
        },
        success: "#50C878",
        warning: "#FFB347",
        error: "#FF6B6B",
        neutral: {
          50: "#F8F9FA",
          100: "#E9ECEF",
          200: "#DEE2E6",
          300: "#CED4DA",
          400: "#ADB5BD",
          500: "#6C757D",
          600: "#495057",
          700: "#343A40",
          800: "#212529",
          900: "#1A1D24",
        },
      },
    },
  },
  plugins: [],
};
export default config;

