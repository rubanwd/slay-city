import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import WordScrambleTask from "./WordScrambleTask";

const meta: Meta<typeof WordScrambleTask> = {
  title: "Mission/WordScrambleTask",
  component: WordScrambleTask,
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
    content: { word: "CAT", translation: "кіт", hint: "кіт", imageUrl: null },
    actionLabel: "Next",
    onComplete: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof WordScrambleTask>;

export const Default: Story = {};

/**
 * A vocabulary entry can be a phrase. Its space is never a tile — the answer
 * shows one slot per letter, grouped into words — so the puzzle is solvable by
 * tapping only the letters the student can actually see.
 */
export const MultiWordAnswer: Story = {
  args: {
    content: {
      word: "ADVENTURE TOURIST",
      translation: "шукач пригод",
      hint: "шукач пригод",
      imageUrl: null,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const finish = canvas.getByRole("button", { name: "Next" });

    await step("spell the phrase from the letter pool", async () => {
      await expect(finish).toBeDisabled();
      for (const letter of "ADVENTURETOURIST") {
        const tile = canvas
          .getAllByRole("button", { name: `Place ${letter}` })
          .find((button) => !(button as HTMLButtonElement).disabled);
        await expect(tile).toBeDefined();
        await userEvent.click(tile!);
      }
    });

    await step("the spelling is accepted without a space tile", async () => {
      await expect(finish).toBeEnabled();
    });
  },
};
