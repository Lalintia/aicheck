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
        frost: {
          50: "#f4f8fc",
          100: "#eaf1fa",
          200: "#d4e4f7",
          300: "#b0cae8",
          400: "#7ba4d4",
          500: "#4a6fa5",
          600: "#3a5a8a",
          700: "#2d4770",
          800: "#1f3355",
          900: "#1a2a3a",
        },
        silver: "#c0c0c0",
        accent: {
          DEFAULT: "#4a6fa5",
          light: "#d4e4f7",
          dark: "#3a5a8a",
        },
      },
      fontFamily: {
        sans: ["'Satoshi'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
