import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2faf6",
          100: "#e2f4ea",
          200: "#c3e7d3",
          300: "#98d5b3",
          400: "#69bd8e",
          500: "#45a170",
          600: "#33835a",
          700: "#296a49",
          800: "#22543c",
          900: "#1c4532",
          950: "#0e2a1e",
        },
        ink: {
          50: "#f8f7f5",
          100: "#efede9",
          200: "#dcd8d1",
          300: "#b9c0bd",
          400: "#8b969e",
          500: "#6c7882",
          600: "#57626b",
          700: "#485158",
          800: "#3d444a",
          900: "#20242a",
          950: "#14171b",
        },
        gold: {
          50: "#fbf7ed",
          100: "#f5eacb",
          200: "#ead9a0",
          300: "#dcc073",
          400: "#cba653",
          500: "#b8903e",
          600: "#9c7830",
          700: "#7c5f28",
          800: "#634b22",
          900: "#503d1d",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(23,43,33,0.06), 0 1px 1px rgba(23,43,33,0.04)",
        cardHover: "0 12px 28px rgba(23,43,33,0.10), 0 3px 8px rgba(23,43,33,0.07)",
        glow: "0 1px 2px rgba(20,23,27,0.15), 0 4px 14px rgba(34,84,60,0.30)",
        glowHover: "0 2px 4px rgba(20,23,27,0.18), 0 8px 22px rgba(34,84,60,0.38)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
export default config;
