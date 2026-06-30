import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SlayCharacter from "./SlayCharacter";

const meta: Meta<typeof SlayCharacter> = {
  title: "UI/SlayCharacter",
  component: SlayCharacter,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#111111" }] },
  },
  tags: ["autodocs"],
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    wiggle: { control: "boolean" },
    color: { control: "color" },
    accentColor: { control: "color" },
  },
  args: { size: "md", wiggle: false },
};

export default meta;
type Story = StoryObj<typeof SlayCharacter>;

export const Playground: Story = {};

export const Wiggling: Story = {
  args: { wiggle: true, size: "lg" },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <SlayCharacter size="xs" />
      <SlayCharacter size="sm" />
      <SlayCharacter size="md" />
      <SlayCharacter size="lg" />
      <SlayCharacter size="xl" />
    </div>
  ),
};

export const ColorVariants: Story = {
  render: () => (
    <div className="flex gap-8">
      <SlayCharacter size="md" color="#00C896" accentColor="#FF2D8E" />
      <SlayCharacter size="md" color="#9DFF00" accentColor="#6A00FF" />
      <SlayCharacter size="md" color="#00F0FF" accentColor="#FF8C00" />
    </div>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <div className="w-48 border border-white/10 rounded-2xl overflow-hidden p-4 bg-[#1a1a1a]">
      <SlayCharacter size="full" wiggle />
    </div>
  ),
};

export const InWardrobeCard: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4 w-64 bg-[#1a1a1a] rounded-2xl border border-neon-pink/30 p-6">
      <SlayCharacter size="lg" wiggle />
      <div className="text-center">
        <p className="text-h3 font-extrabold text-white">Cool Shades</p>
        <p className="text-label text-lime-green tracking-widest mt-0.5">EPIC · OWNED</p>
      </div>
    </div>
  ),
};
