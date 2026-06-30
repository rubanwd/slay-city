import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SlayCard from "./SlayCard";
import SlayButton from "./SlayButton";

const meta: Meta<typeof SlayCard> = {
  title: "UI/SlayCard",
  component: SlayCard,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#111111" }] },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["pink", "green", "cyan", "purple", "ghost"] },
    hoverable: { control: "boolean" },
    flush: { control: "boolean" },
  },
  args: {
    variant: "pink",
    hoverable: false,
    flush: false,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SlayCard>;

// ── Playground ────────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => (
    <SlayCard {...args}>
      <SlayCard.Header divided>
        <span className="text-h3 font-bold text-white">Word Quest</span>
        <span className="text-label text-white/40">2/5</span>
      </SlayCard.Header>
      <SlayCard.Content>
        <p className="text-body text-white/70">What is the English word for this item?</p>
      </SlayCard.Content>
      <SlayCard.Footer divided>
        <SlayButton size="sm" variant="green" className="w-full">Continue →</SlayButton>
      </SlayCard.Footer>
    </SlayCard>
  ),
};

// ── All variants ──────────────────────────────────────────────────────────────

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      {(["pink", "green", "cyan", "purple", "ghost"] as const).map((v) => (
        <SlayCard key={v} variant={v}>
          <SlayCard.Header>
            <span className="text-h3 font-bold text-white capitalize">{v} Card</span>
          </SlayCard.Header>
          <SlayCard.Content>
            <p className="text-small text-white/50">Neon border + glow shadow variant.</p>
          </SlayCard.Content>
        </SlayCard>
      ))}
    </div>
  ),
};

// ── Hoverable ─────────────────────────────────────────────────────────────────

export const Hoverable: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <SlayCard variant="green" hoverable>
        <SlayCard.Header>
          <span className="text-h3 font-bold text-white">Neon Hoodie</span>
          <span className="text-small text-lime-green font-semibold">Owned</span>
        </SlayCard.Header>
        <SlayCard.Content>
          <p className="text-small text-white/50">Hover to see the glow intensify.</p>
        </SlayCard.Content>
      </SlayCard>
      <SlayCard variant="pink" hoverable>
        <SlayCard.Header>
          <span className="text-h3 font-bold text-white">Cool Shades</span>
          <span className="text-small text-neon-pink font-semibold">150 coins</span>
        </SlayCard.Header>
        <SlayCard.Content>
          <p className="text-small text-white/50">Hover to see the glow intensify.</p>
        </SlayCard.Content>
      </SlayCard>
    </div>
  ),
};

// ── Stat card (as seen in Parent Dashboard) ───────────────────────────────────

export const StatCard: Story = {
  render: () => (
    <div className="flex gap-3 w-80">
      <SlayCard variant="ghost" className="flex-1 items-start">
        <p className="text-label text-white/40 mb-1">Missions</p>
        <span className="text-display font-black text-white leading-none">12</span>
      </SlayCard>
      <SlayCard variant="ghost" className="flex-1 items-start">
        <p className="text-label text-white/40 mb-1">Streak</p>
        <span className="text-display font-black text-lime-green leading-none">2</span>
      </SlayCard>
    </div>
  ),
};

// ── Mission row card ──────────────────────────────────────────────────────────

export const MissionRow: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      {[
        { name: "Home Street", status: "completed", color: "text-lime-green" },
        { name: "Central Park", status: "completed", color: "text-lime-green" },
        { name: "Neon Market", status: "locked", color: "text-white/30" },
      ].map((item) => (
        <SlayCard key={item.name} variant="ghost" className="flex-row items-center gap-3 py-3">
          <span className={`text-lg ${item.color}`}>
            {item.status === "completed" ? "✓" : "🔒"}
          </span>
          <SlayCard.Content>
            <p className="text-body-strong text-white">{item.name}</p>
            <p className={`text-label ${item.color}`}>{item.status.toUpperCase()}</p>
          </SlayCard.Content>
        </SlayCard>
      ))}
    </div>
  ),
};

// ── Reward card (full-bleed header) ──────────────────────────────────────────

export const RewardCard: Story = {
  render: () => (
    <SlayCard variant="cyan" className="w-80">
      <SlayCard.Header divided>
        <span className="text-label text-cyan tracking-widest">Active Mission</span>
        <span className="text-label text-white/30">CAFÉ</span>
      </SlayCard.Header>
      <SlayCard.Content>
        <p className="text-h2 font-extrabold text-white mb-1">What do you say?</p>
        <p className="text-body text-white/60">
          You walk into the café. The barista looks at you.
        </p>
      </SlayCard.Content>
      <SlayCard.Footer divided>
        <SlayButton variant="pink" size="sm" className="w-full">
          Start Mission →
        </SlayButton>
      </SlayCard.Footer>
    </SlayCard>
  ),
};

// ── Mobile overflow check ─────────────────────────────────────────────────────

export const LongContent: Story = {
  render: () => (
    <SlayCard variant="purple" className="w-80">
      <SlayCard.Header divided>
        <span className="text-h3 font-bold text-white truncate">
          An extremely long card title that would overflow
        </span>
      </SlayCard.Header>
      <SlayCard.Content>
        <p className="text-body text-white/70 break-words">
          {"superlongwordwithnobreaksthatcouldcauseoverflowissuesonmobiledevices ".repeat(2)}
        </p>
      </SlayCard.Content>
    </SlayCard>
  ),
};
