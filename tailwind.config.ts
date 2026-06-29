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
        "neon-pink": "#FF2D8E",
        "lime-green": "#9DFF00",
        cyan: "#00F0FF",
        purple: "#6A00FF",
        black: "#111111",
        white: "#FFFFFF",
      },
    },
  },
  plugins: [],
};

export default config;
