import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        bg: {
          base: "#08090b",
          surface: "#101217",
          "surface-elevated": "#161922",
        },
        brand: {
          red: "#e51d24",
          "red-glow": "rgba(229, 29, 36, 0.4)",
          "red-muted": "rgba(229, 29, 36, 0.15)",
          gold: "#e5a953",
          "gold-muted": "rgba(229, 169, 83, 0.15)",
        },
      },
      fontFamily: {
        display: ["var(--font-anton)", "sans-serif"],
        heading: ["var(--font-outfit)", "sans-serif"],
        body: ["var(--font-jakarta)", "sans-serif"],
        script: ["var(--font-script)", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
