import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SlayButton from "./SlayButton";

const meta: Meta<typeof SlayButton> = {
  title: "UI/SlayButton",
  component: SlayButton,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#111111" }] },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["pink", "green", "ghost"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
    children: { control: "text" },
  },
  args: {
    children: "Get Started",
    variant: "pink",
    size: "md",
    loading: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof SlayButton>;

// ── Playground ────────────────────────────────────────────────────────────────

export const Playground: Story = {};

// ── Variants ──────────────────────────────────────────────────────────────────

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <SlayButton variant="pink">Neon Pink</SlayButton>
      <SlayButton variant="green">Lime Green</SlayButton>
      <SlayButton variant="ghost">Ghost</SlayButton>
    </div>
  ),
};

// ── Sizes ─────────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <SlayButton size="sm">Small</SlayButton>
      <SlayButton size="md">Medium</SlayButton>
      <SlayButton size="lg">Large</SlayButton>
    </div>
  ),
};

// ── States ────────────────────────────────────────────────────────────────────

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <SlayButton>Default</SlayButton>
      <SlayButton loading>Loading…</SlayButton>
      <SlayButton disabled>Disabled</SlayButton>
    </div>
  ),
};

export const LoadingVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <SlayButton variant="pink" loading>Saving…</SlayButton>
      <SlayButton variant="green" loading>Processing…</SlayButton>
      <SlayButton variant="ghost" loading>Loading…</SlayButton>
    </div>
  ),
};

// ── With icons ────────────────────────────────────────────────────────────────

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <SlayButton variant="pink" iconLeft={<span>▶</span>}>
        Start Mission
      </SlayButton>
      <SlayButton variant="green" iconRight={<span>→</span>}>
        Continue
      </SlayButton>
      <SlayButton variant="ghost" iconLeft={<span>🛍️</span>}>
        Open Wardrobe
      </SlayButton>
    </div>
  ),
};

// ── Full width (as used inside AppContainer) ──────────────────────────────────

export const FullWidth: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-72">
      <SlayButton variant="pink" className="w-full">Get Started</SlayButton>
      <SlayButton variant="ghost" className="w-full">Sign In</SlayButton>
    </div>
  ),
};
