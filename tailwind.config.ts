import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        crave: {
          cream: "#faf2bc",
          blue: "#b7dbed",
          brown: "#573219",
          pink: "#f1a4b6",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        script: ["var(--font-caveat)", "cursive"],
      },
      borderRadius: {
        card: "1.25rem",
        hero: "1.75rem",
      },
      boxShadow: {
        soft: "0 10px 40px -10px rgba(87, 50, 25, 0.10)",
        dock: "0 20px 40px -10px rgba(87, 50, 25, 0.18)",
      },
      keyframes: {
        slideUpFade: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-up-fade": "slideUpFade 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
