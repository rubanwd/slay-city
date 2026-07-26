import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import BackLink from "./BackLink";

const meta: Meta<typeof BackLink> = {
  title: "UI/BackLink",
  component: BackLink,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#111111" }] },
  },
  argTypes: {
    label: { control: "text" },
    fallbackHref: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof BackLink>;

/** The default: quiet, secondary, sits under a screen's real actions. */
export const Default: Story = {};

/** Callers translate the whole label, arrow included. */
export const Translated: Story = {
  args: { label: "← Назад" },
};
