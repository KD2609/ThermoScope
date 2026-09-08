/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        command: {
          bg: "#080d1a",
          card: "#0f172a",
          surface: "#131e36",
          border: "#1e293b",
          accent: "#f97316"
        },
        thermal: {
          critical: "#ef4444",
          high: "#f97316",
          medium: "#eab308",
          low: "#10b981",
          flare: "#a855f7",
          mining: "#06b6d4"
        }
      }
    },
  },
  plugins: [],
}
