/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stark: {
          black: "#000000",
          950: "#080808",
          900: "#0d0d0d",
          850: "#121212",
          800: "#171717",
          700: "#222222",
          600: "#2e2e2e",
        },
        charcoal: {
          900: "#141416",
          800: "#1a1a1e",
          700: "#242429",
          600: "#323238",
          500: "#45454d",
          400: "#6e6e78",
          300: "#9898a4",
          200: "#c4c4cf",
          100: "#e4e4eb",
        },
        pure: {
          white: "#ffffff",
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      }
    },
  },
  plugins: [],
}
