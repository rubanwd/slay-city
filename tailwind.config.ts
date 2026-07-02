import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-primary)", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: "var(--fs-display)",
        h1: "var(--fs-h1)",
        h2: "var(--fs-h2)",
        h3: "var(--fs-h3)",
        body: "var(--fs-body)",
        small: "var(--fs-small)",
        label: "var(--fs-label)",
      },
      fontWeight: {
        black: "900",
      },
      lineHeight: {
        tight: "var(--lh-tight)",
        snug: "var(--lh-snug)",
        normal: "var(--lh-normal)",
        relaxed: "var(--lh-relaxed)",
      },
      letterSpacing: {
        tight: "var(--ls-tight)",
        wide: "var(--ls-wide)",
        widest: "var(--ls-widest)",
      },
      colors: {
        "neon-pink": "rgb(var(--color-neon-pink) / <alpha-value>)",
        "lime-green": "rgb(var(--color-lime-green) / <alpha-value>)",
        cyan: "rgb(var(--color-cyan) / <alpha-value>)",
        purple: "rgb(var(--color-purple) / <alpha-value>)",
        black: "rgb(var(--color-black) / <alpha-value>)",
        white: "rgb(var(--color-white) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};

export default config;
