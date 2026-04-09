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
        // Navy + Sky palette — B2B sales enablement, authoritative, trustworthy
        // Keeps `frost` token names for backward compat but maps to Slate + Sky values
        frost: {
          50: "#f8fafc",   // Slate 50 — page background
          100: "#f1f5f9",  // Slate 100 — muted surface
          200: "#e2e8f0",  // Slate 200 — borders
          300: "#cbd5e1",  // Slate 300
          400: "#94a3b8",  // Slate 400 — muted text, icons
          500: "#0369a1",  // Sky 700 — primary CTA (accent)
          600: "#075985",  // Sky 800 — CTA hover
          700: "#334155",  // Slate 700 — body text
          800: "#1e293b",  // Slate 800
          900: "#0f172a",  // Slate 900 / Navy — headlines
        },
        silver: "#c0c0c0",
        accent: {
          DEFAULT: "#0369a1",
          light: "#e0f2fe",
          dark: "#075985",
        },
      },
      fontFamily: {
        sans: ["'Satoshi'", "'Anuphan'", "system-ui", "-apple-system", "sans-serif"],
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
