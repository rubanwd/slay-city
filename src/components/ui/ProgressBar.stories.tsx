import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ProgressBar from "./ProgressBar";

const meta: Meta<typeof ProgressBar> = {
  title: "UI/ProgressBar",
  component: ProgressBar,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#111111" }] },
  },
  tags: ["autodocs"],
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    variant: { control: "select", options: ["green", "pink", "cyan"] },
    height: { control: { type: "range", min: 4, max: 24, step: 2 } },
    animate: { control: "boolean" },
  },
  args: { value: 65, variant: "green", height: 10, animate: true },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Playground: Story = {};

export const WithLabels: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-80">
      <ProgressBar value={45} label="XP" labelRight="450 / 1000 XP" />
      <ProgressBar value={72} variant="pink" label="Level" labelRight="Lvl 12 → 13" />
      <ProgressBar value={30} variant="cyan" label="Streak" labelRight="3 / 10 days" />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-5 w-80">
      <ProgressBar value={60} variant="green" label="Green (XP)" />
      <ProgressBar value={60} variant="pink"  label="Pink (Health)" />
      <ProgressBar value={60} variant="cyan"  label="Cyan (Streak)" />
    </div>
  ),
};

export const Heights: Story = {
  render: () => (
    <div className="flex flex-col gap-5 w-80">
      <ProgressBar value={70} height={4}  label="Thin (4px)" />
      <ProgressBar value={70} height={10} label="Default (10px)" />
      <ProgressBar value={70} height={18} label="Chunky (18px)" />
    </div>
  ),
};

export const EdgeCases: Story = {
  render: () => (
    <div className="flex flex-col gap-5 w-80">
      <ProgressBar value={0}   label="Empty"    labelRight="0%" />
      <ProgressBar value={5}   label="Almost empty" labelRight="5%" />
      <ProgressBar value={100} label="Full"     labelRight="100%" />
    </div>
  ),
};

export const LiveUpdate: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [xp, setXp] = useState(20);
    return (
      <div className="flex flex-col gap-6 w-80">
        <ProgressBar value={xp} label="XP Progress" labelRight={`${xp} / 100 XP`} />
        <div className="flex gap-2">
          <button
            onClick={() => setXp((v) => Math.max(0, v - 10))}
            className="flex-1 py-2 rounded-xl bg-white/10 text-white text-small font-bold hover:bg-white/20"
          >
            −10 XP
          </button>
          <button
            onClick={() => setXp((v) => Math.min(100, v + 10))}
            className="flex-1 py-2 rounded-xl bg-lime-green text-black text-small font-bold hover:brightness-110"
          >
            +10 XP
          </button>
        </div>
      </div>
    );
  },
};
