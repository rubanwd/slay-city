import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SlayButton from "./SlayButton";

const meta: Meta<typeof SlayButton> = {
  title: "UI/SlayButton",
  component: SlayButton,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#111111" }] },
  },
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

// в”Ђв”Ђ Playground в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

export const Playground: Story = {};

// в”Ђв”Ђ Variants в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <SlayButton variant="pink">Neon Pink</SlayButton>
      <SlayButton variant="green">Lime Green</SlayButton>
      <SlayButton variant="ghost">Ghost</SlayButton>
    </div>
  ),
};

// в”Ђв”Ђ Sizes в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <SlayButton size="sm">Small</SlayButton>
      <SlayButton size="md">Medium</SlayButton>
      <SlayButton size="lg">Large</SlayButton>
    </div>
  ),
};

// в”Ђв”Ђ States в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <SlayButton>Default</SlayButton>
      <SlayButton loading>LoadingвЂ¦</SlayButton>
      <SlayButton disabled>Disabled</SlayButton>
    </div>
  ),
};

export const LoadingVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <SlayButton variant="pink" loading>SavingвЂ¦</SlayButton>
      <SlayButton variant="green" loading>ProcessingвЂ¦</SlayButton>
      <SlayButton variant="ghost" loading>LoadingвЂ¦</SlayButton>
    </div>
  ),
};

// в”Ђв”Ђ With icons в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <SlayButton variant="pink" iconLeft={<span>в–¶</span>}>
        Start Mission
      </SlayButton>
      <SlayButton variant="green" iconRight={<span>в†’</span>}>
        Continue
      </SlayButton>
      <SlayButton variant="ghost" iconLeft={<span>рџ›ЌпёЏ</span>}>
        Open Wardrobe
      </SlayButton>
    </div>
  ),
};

// в”Ђв”Ђ Full width (as used inside AppContainer) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

export const FullWidth: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-72">
      <SlayButton variant="pink" className="w-full">Get Started</SlayButton>
      <SlayButton variant="ghost" className="w-full">Sign In</SlayButton>
    </div>
  ),
};

