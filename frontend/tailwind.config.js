/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f8f9fa",
          100: "#e9ecef",
          200: "#dee2e6",
          300: "#ced4da",
          400: "#adb5bd",
          500: "#6c757d",
          600: "#495057",
          700: "#343a40",
          800: "#212529",
          900: "#0d1117",
          950: "#000000",
        },
        background: {
          DEFAULT: "#000000",
          secondary: "#0d1117",
          tertiary: "#161b22",
        },
        surface: {
          DEFAULT: "#0d1117",
          secondary: "#161b22",
          tertiary: "#21262d",
        },
        border: {
          DEFAULT: "#30363d",
          secondary: "#21262d",
        },
        text: {
          primary: "#f0f6fc",
          secondary: "#8b949e",
          muted: "#6e7681",
        },
        accent: {
          DEFAULT: "#58a6ff",
          secondary: "#1f6feb",
          success: "#238636",
          warning: "#d29922",
          error: "#da3633",
        },
        ring: {
          DEFAULT: "#58a6ff",
          secondary: "#1f6feb",
          success: "#238636",
          warning: "#d29922",
          error: "#da3633",
        },
        ringOffset: {
          background: "#000000",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
