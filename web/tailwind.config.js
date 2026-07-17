/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14182B",
          soft: "#1D2238",
          muted: "#4B4636",
        },
        paper: {
          DEFAULT: "#FBF3E1",
          dim: "#F3E7CE",
        },
        spark: {
          50: "#FFF6E0",
          100: "#FFEAB8",
          300: "#FFCE6E",
          500: "#FFB627",
          600: "#F0A012",
          700: "#C77E08",
        },
        ember: {
          400: "#EB6E5F",
          500: "#E1483B",
          600: "#C22F24",
        },
        teal: {
          400: "#2E9583",
          500: "#1F7A6C",
          600: "#175E53",
        },
        // Kept for backward-compat with existing UI primitives (Button/Input focus rings, etc.)
        brand: {
          50: "#FFF6E0",
          100: "#FFEAB8",
          200: "#FFCE6E",
          300: "#FFB627",
          400: "#F0A012",
          500: "#F0A012",
          600: "#C77E08",
          700: "#9C6206",
          800: "#7A4C05",
          900: "#5C3A04",
        },
      },
      fontFamily: {
        display: ["'Bricolage Grotesque'", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1", transform: "scaleY(1)" },
          "50%": { opacity: "0.85", transform: "scaleY(0.94)" },
        },
        "spark-catch": {
          "0%": { opacity: "0", transform: "scale(0.4)" },
          "60%": { opacity: "1", transform: "scale(1.15)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        flicker: "flicker 2.2s ease-in-out infinite",
        "spark-catch": "spark-catch 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};
