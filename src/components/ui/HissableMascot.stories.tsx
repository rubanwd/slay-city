import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import HissableMascot from "./HissableMascot";

const meta: Meta<typeof HissableMascot> = {
  title: "UI/HissableMascot",
  component: HissableMascot,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
    viewport: { defaultViewport: "iphone14" },
  },
  args: {
    src: "/wardrobe/slay-base.webp",
    imageClassName:
      "h-24 w-24 object-contain drop-shadow-[0_0_20px_rgba(157,255,0,0.45)] animate-loader-bob",
    shadowClassName: "mt-1 h-2 w-16 rounded-full bg-lime-green/40 blur-[3px] animate-loader-shadow",
  },
};

export default meta;
type Story = StoryObj<typeof HissableMascot>;

/** Tap the snake to hear it hiss (the sound is synthesised, not an asset). */
export const Playground: Story = {};

/** The smaller variant used for the you-are-here marker on the city map. */
export const MapMarkerSize: Story = {
  args: {
    imageClassName:
      "h-[clamp(3.5rem,12vmin,5.5rem)] w-[clamp(3.5rem,12vmin,5.5rem)] object-contain drop-shadow-[0_0_20px_rgba(157,255,0,0.45)] animate-loader-bob",
    shadowClassName: "mt-1 h-2 w-12 rounded-full bg-lime-green/40 blur-[3px] animate-loader-shadow",
  },
};
