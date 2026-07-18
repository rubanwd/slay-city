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
    missionTitle: { control: "text" },
  },
  args: {
    coins: 50,
    xp: 100,
    missionTitle: "On Guard",
    taskNames: ["Play Snake Game"],
  },
};

export default meta;
type Story = StoryObj<typeof RewardScreen>;

export const Default: Story = {};

export const NoTasks: Story = {
  args: { taskNames: [] },
};

export const MultipleTasks: Story = {
  args: { taskNames: ["Vocabulary", "Matching", "Quiz"] },
};

export const BigRewards: Story = {
  args: { coins: 500, xp: 1200, missionTitle: "Central Plaza Grand Tour" },
};
