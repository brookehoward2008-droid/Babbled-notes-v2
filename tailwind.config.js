/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "neon-purple": "#c084fc",
        "neon-cyan": "#22d3ee",
        "neon-pink": "#f472b6",
        slate: {
          850: "#1a2538",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
