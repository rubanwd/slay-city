import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import SnakeGameTask, { type SnakeGameTaskProps } from "./SnakeGameTask";

/**
 * In a real mission the finish button advances to the next task. A story has
 * nowhere to advance to, so it restarts the game instead — otherwise the button
 * would appear dead once the word is collected.
 */
function ReplayableSnake(args: SnakeGameTaskProps) {
  const [round, setRound] = useState(0);
  return <SnakeGameTask {...args} key={round} onComplete={() => setRound((r) => r + 1)} />;
}

const meta: Meta<typeof SnakeGameTask> = {
  title: "Mission/SnakeGameTask",
  component: SnakeGameTask,
  parameters: {
    layout: "centered",
    nextjs: { appDirectory: true },
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#111111" }] },
  },
  decorators: [
    (Story) => (
      <div className="w-[380px] p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    content: { word: "CAT", translation: "кіт", prompt: "Collect the letters in order" },
    actionLabel: "Play again",
    onComplete: () => {},
  },
  render: (args) => <ReplayableSnake {...args} />,
};

export default meta;
type Story = StoryObj<typeof SnakeGameTask>;

export const Default: Story = {};

export const LongWord: Story = {
  args: {
    content: { word: "ELEPHANT", translation: "слон", prompt: "Collect the letters in order" },
  },
};

export const NoTranslation: Story = {
  args: {
    content: { word: "SUN", translation: null, prompt: "Steer the snake to spell the word" },
  },
};
