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
      colors: {
        "neon-pink": "var(--color-neon-pink)",
        "lime-green": "var(--color-lime-green)",
        cyan: "var(--color-cyan)",
        purple: "var(--color-purple)",
        black: "var(--color-black)",
        white: "var(--color-white)",
      },
    },
  },
  plugins: [],
};

export default config;
