import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        typeui: {
          primary: "#6EACDA",
          secondary: "#03346E",
          success: "#6EACDA",
          warning: "#DDF2FD",
          danger: "#DDF2FD",
          text: "#021526",
          surface: "#DDF2FD",
          cream: "#DDF2FD",
          base: "#DDF2FD",
          card: "#DDF2FD",
          night: "#021526",
          ember: "#03346E",
          muted: "#03346E",
          border: "#6EACDA"
        },
        obsidian: {
          black: "#021526",
          green: "#6EACDA",
          dim: "#6EACDA",
          white: "#DDF2FD",
          warning: "#DDF2FD"
        }
      },
      fontFamily: {
        sans: ["var(--font-chakra)", "Chakra Petch", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-chakra)", "Chakra Petch", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "Fira Code", "Consolas", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        terminal: "0 0 24px rgba(110, 172, 218, 0.18)",
        poster: "0 18px 44px rgba(2, 21, 38, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
