import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RewardModal from "./RewardModal";
import SlayButton from "./SlayButton";

const meta: Meta<typeof RewardModal> = {
  title: "UI/RewardModal",
  component: RewardModal,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#111111" }] },
  },
  tags: ["autodocs"],
  args: { open: true, onClose: () => {} },
};

export default meta;
type Story = StoryObj<typeof RewardModal>;

/* ── helpers ──────────────────────────────────────────────────────────────── */

const EmojiImage = ({ emoji }: { emoji: string }) => (
  <span className="text-7xl select-none">{emoji}</span>
);

const RewardChip = ({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) => (
  <div className="flex flex-col items-center gap-0.5">
    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
      {icon}
    </div>
    <span className="text-h3 font-black text-white">{value}</span>
    <span className="text-label text-white/40 tracking-widest">{label}</span>
  </div>
);

/* ── stories ──────────────────────────────────────────────────────────────── */

export const MissionComplete: Story = {
  render: (args) => (
    <RewardModal
      {...args}
      title="AMAZING!"
      image={<EmojiImage emoji="🎉" />}
      description="You completed the Café mission! Keep going to unlock Central Park."
      rewards={
        <>
          <RewardChip icon="🪙" value="+50" label="Coins" />
          <RewardChip icon="⭐" value="+100" label="XP" />
        </>
      }
    />
  ),
};

export const NewZoneUnlocked: Story = {
  render: (args) => (
    <RewardModal
      {...args}
      title={
        <>
          Next Stop:{" "}
          <span className="text-cyan">Central Park</span>
          <br />
          unlocked!
        </>
      }
      image={<EmojiImage emoji="🏙️" />}
      description="A brand-new zone is waiting. Explore it to discover new words and missions."
      rewards={
        <>
          <RewardChip icon="🗺️" value="1" label="Zone" />
          <RewardChip icon="⭐" value="+200" label="XP" />
        </>
      }
      action={
        <SlayButton variant="green" className="w-full" size="lg">
          Explore Now →
        </SlayButton>
      }
    />
  ),
};

export const WardrobeItem: Story = {
  render: (args) => (
    <RewardModal
      {...args}
      title="Item Unlocked!"
      image={<EmojiImage emoji="🕶️" />}
      description="Cool Shades are now in your wardrobe. Equip them to flex on the city."
      rewards={<RewardChip icon="🛍️" value="Cool Shades" label="Epic" />}
      action={
        <div className="flex flex-col gap-2 w-full">
          <SlayButton variant="pink" className="w-full">Equip Now</SlayButton>
          <SlayButton variant="ghost" className="w-full" size="sm" onClick={args.onClose}>
            Maybe Later
          </SlayButton>
        </div>
      }
    />
  ),
};

export const Interactive: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen] = useState(false);
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <SlayButton variant="pink" onClick={() => setOpen(true)}>
          Claim Reward
        </SlayButton>
        <RewardModal
          open={open}
          onClose={() => setOpen(false)}
          title="AMAZING!"
          image={<EmojiImage emoji="🎉" />}
          description="You completed today's mission! Come back tomorrow to keep your streak alive."
          rewards={
            <>
              <RewardChip icon="🪙" value="+50" label="Coins" />
              <RewardChip icon="⭐" value="+100" label="XP" />
              <RewardChip icon="🔥" value="7" label="Streak" />
            </>
          }
        />
      </div>
    );
  },
};

export const MinimalNoImage: Story = {
  render: (args) => (
    <RewardModal
      {...args}
      title="Well done!"
      description="You answered 5 questions correctly in a row."
    />
  ),
};
