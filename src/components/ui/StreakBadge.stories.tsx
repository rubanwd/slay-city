import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import StreakBadge from "./StreakBadge";

const meta: Meta<typeof StreakBadge> = {
  title: "UI/StreakBadge",
  component: StreakBadge,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#111111" }] },
  },
  argTypes: {
    count: { control: { type: "number", min: 0 } },
    size: { control: "select", options: ["sm", "md", "lg"] },
    tooltip: { control: "text" },
  },
  args: { count: 7, size: "md" },
};

export default meta;
type Story = StoryObj<typeof StreakBadge>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <StreakBadge count={3}  size="sm" />
      <StreakBadge count={7}  size="md" />
      <StreakBadge count={14} size="lg" />
    </div>
  ),
};

export const HighCount: Story = {
  args: { count: 365, size: "lg" },
};

export const ZeroStreak: Story = {
  args: { count: 0 },
};

export const LiveCounter: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [days, setDays] = useState(3);
    return (
      <div className="flex flex-col items-center gap-6">
        <StreakBadge count={days} size="lg" />
        <div className="flex gap-3">
          <button
            onClick={() => setDays((d) => Math.max(0, d - 1))}
            className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20"
          >
            в€’ day
          </button>
          <button
            onClick={() => setDays((d) => d + 1)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple to-cyan text-white font-bold hover:brightness-110"
          >
            + day
          </button>
        </div>
        <p className="text-small text-white/40">Hover the badge to see tooltip</p>
      </div>
    );
  },
};

export const InContext: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-72 bg-[#1a1a1a] rounded-2xl border border-white/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-h3 font-extrabold text-white">SLAY CITY</span>
        <StreakBadge count={7} size="sm" />
      </div>
      <div className="h-px bg-white/10" />
      <p className="text-small text-white/50">As seen in the app header вЂ” small variant alongside the logo.</p>
    </div>
  ),
};

