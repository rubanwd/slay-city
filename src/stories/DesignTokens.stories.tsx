import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta = {
  title: "Design System/Color Tokens",
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
    controls: { disable: true },
  },
};
export default meta;

type Story = StoryObj;

const TOKENS = [
  {
    group: "Brand",
    swatches: [
      { name: "Neon Pink",  var: "--color-neon-pink",  hex: "#FF2D8E" },
      { name: "Lime Green", var: "--color-lime-green",  hex: "#9DFF00" },
      { name: "Cyan",       var: "--color-cyan",        hex: "#00F0FF" },
      { name: "Purple",     var: "--color-purple",      hex: "#6A00FF" },
    ],
  },
  {
    group: "Base",
    swatches: [
      { name: "Black",      var: "--color-black",       hex: "#111111" },
      { name: "White",      var: "--color-white",       hex: "#FFFFFF" },
    ],
  },
  {
    group: "Semantic",
    swatches: [
      { name: "Background", var: "--color-background",  hex: "#111111" },
      { name: "Foreground", var: "--color-foreground",  hex: "#FFFFFF" },
      { name: "Accent",     var: "--color-accent",      hex: "#FF2D8E" },
      { name: "Highlight",  var: "--color-highlight",   hex: "#9DFF00" },
    ],
  },
];

function Swatch({ name, varName, hex }: { name: string; varName: string; hex: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="w-full h-20 rounded-xl border border-white/10"
        style={{ background: `var(${varName})` }}
      />
      <div>
        <p className="text-sm font-bold text-white">{name}</p>
        <p className="text-xs text-white/40 font-mono">{varName}</p>
        <p className="text-xs text-white/40 font-mono">{hex}</p>
      </div>
    </div>
  );
}

export const Colors: Story = {
  render: () => (
    <div className="flex flex-col gap-10 p-4">
      {TOKENS.map(({ group, swatches }) => (
        <div key={group}>
          <h2 className="text-xs uppercase tracking-widest text-white/40 font-bold mb-4">
            {group}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {swatches.map((s) => (
              <Swatch key={s.var} name={s.name} varName={s.var} hex={s.hex} />
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

const TYPE_TOKENS = [
  { label: "Display",      cls: "text-display font-black",   note: "Reward screens, splash numbers" },
  { label: "H1",           cls: "text-h1 font-extrabold",    note: "Page / screen titles" },
  { label: "H2",           cls: "text-h2 font-bold",         note: "Section headings" },
  { label: "H3",           cls: "text-h3 font-bold",         note: "Card / subsection headings" },
  { label: "Body",         cls: "text-body",                 note: "Standard body copy" },
  { label: "Body Strong",  cls: "text-body font-semibold",   note: "Emphasised body (list items)" },
  { label: "Small",        cls: "text-small",                note: "Captions, stat labels" },
  { label: "Label",        cls: "text-label font-bold tracking-widest uppercase", note: "ALL-CAPS tags (COMPLETED, XP)" },
];

export const Typography: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-4">
      {TYPE_TOKENS.map(({ label, cls, note }) => (
        <div key={label} className="flex items-baseline gap-4 border-b border-white/10 pb-4">
          <div className="w-28 shrink-0">
            <p className="text-xs text-white/30 font-mono">{label}</p>
          </div>
          <p className={`${cls} text-white flex-1`}>Slay City</p>
          <p className="text-xs text-white/30 hidden sm:block">{note}</p>
        </div>
      ))}
    </div>
  ),
};
