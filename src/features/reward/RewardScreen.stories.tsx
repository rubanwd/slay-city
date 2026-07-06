import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import RewardScreen from "./RewardScreen";

const meta: Meta<typeof RewardScreen> = {
  title: "Reward/RewardScreen",
  component: RewardScreen,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#111111" }] },
  },
  argTypes: {
    coins: { control: { type: "number", min: 0 } },
    xp: { control: { type: "number", min: 0 } },
    streak: { control: { type: "number", min: 0 } },
    nextStop: { control: "text" },
  },
  args: {
    coins: 50,
    xp: 100,
    streak: 2,
    nextStop: "Central Park",
  },
};

export default meta;
type Story = StoryObj<typeof RewardScreen>;

export const Default: Story = {};

export const NoNextStop: Story = {
  args: { nextStop: null },
};

export const BigRewards: Story = {
  args: { coins: 500, xp: 1200, streak: 30, nextStop: "Times Square" },
};
