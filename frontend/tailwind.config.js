/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Google Sans"', '"DM Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Google Sans"', 'sans-serif'],
        heading: ['"Google Sans"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        canvas: {
          DEFAULT: '#F4F7FA',
          subtle: '#EEF3F7',
          deep: '#E8EEF3',
          card: '#FFFFFF',
        },
        ink: {
          primary: '#102A43',
          secondary: '#52677D',
          muted: '#6B7C8F',
          light: '#9FB3C8',
        },
        line: {
          DEFAULT: '#D9E2EA',
          subtle: '#EAEFF5',
          dark: '#BCCCDC',
        },
        brand: {
          blue: '#2F6FED',
          'blue-hover': '#2558BE',
          'blue-light': '#EEF4FF',
          teal: '#3BAA91',
          'teal-light': '#E8F7F3',
          slate: '#6687A8',
        },
        tier: {
          'critical-text': '#991B1B',
          'critical-bg': '#FEE2E2',
          'critical-border': '#FECACA',
          'high-text': '#B91C1C',
          'high-bg': '#FEF2F2',
          'high-border': '#FECACA',
          'medium-text': '#92400E',
          'medium-bg': '#FEF3C7',
          'medium-border': '#FDE68A',
          'low-text': '#065F46',
          'low-bg': '#D1FAE5',
          'low-border': '#A7F3D0',
          'info-text': '#1E40AF',
          'info-bg': '#DBEAFE',
          'info-border': '#BFDBFE',
        },
        // Backwards compatibility aliases to avoid broken references
        command: {
          bg: "#F4F7FA",
          card: "#FFFFFF",
          surface: "#EEF3F7",
          border: "#D9E2EA",
          accent: "#2F6FED"
        },
        thermal: {
          critical: "#B91C1C",
          high: "#C53030",
          medium: "#D97706",
          low: "#059669",
          flare: "#7C3AED",
          mining: "#0891B2"
        }
      },
      boxShadow: {
        'glass': '0 4px 20px -2px rgba(16, 42, 67, 0.05), 0 2px 6px -1px rgba(16, 42, 67, 0.03)',
        'glass-hover': '0 10px 30px -4px rgba(16, 42, 67, 0.08), 0 4px 10px -2px rgba(16, 42, 67, 0.04)',
        'subtle': '0 1px 3px 0 rgba(16, 42, 67, 0.04), 0 1px 2px 0 rgba(16, 42, 67, 0.02)',
      }
    },
  },
  plugins: [],
}
