import type { Preview } from "@storybook/nextjs-vite";
import "../src/app/globals.css";

const MOBILE_VIEWPORTS = {
  iphoneSE: {
    name: "iPhone SE (375×667)",
    styles: { width: "375px", height: "667px" },
    type: "mobile" as const,
  },
  iphone14: {
    name: "iPhone 14 (390×844)",
    styles: { width: "390px", height: "844px" },
    type: "mobile" as const,
  },
  pixel7: {
    name: "Pixel 7 (412×915)",
    styles: { width: "412px", height: "915px" },
    type: "mobile" as const,
  },
  ipadMini: {
    name: "iPad Mini (768×1024)",
    styles: { width: "768px", height: "1024px" },
    type: "tablet" as const,
  },
};

const preview: Preview = {
  parameters: {
    /* ── Controls ───────────────────────────────────────────────────────── */
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    /* ── Backgrounds ────────────────────────────────────────────────────── */
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark",  value: "#111111" },
        { name: "card",  value: "#1a1a1a" },
        { name: "light", value: "#f0f0f0" },
      ],
    },

    /* ── Viewport ───────────────────────────────────────────────────────── */
    viewport: {
      viewports: MOBILE_VIEWPORTS,
      defaultViewport: "iphone14",
    },

    /* ── A11y ───────────────────────────────────────────────────────────── */
    a11y: {
      test: "todo",
    },

    /* ── Docs ───────────────────────────────────────────────────────────── */
    docs: {
      theme: undefined, // uses Storybook default dark theme
    },
  },
};

export default preview;
