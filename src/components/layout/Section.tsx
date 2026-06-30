import { type ReactNode } from "react";

type SpacingSize = "none" | "xs" | "sm" | "md" | "lg" | "xl";

interface SectionProps {
  children: ReactNode;
  className?: string;
  /** Vertical padding above the section */
  pt?: SpacingSize;
  /** Vertical padding below the section */
  pb?: SpacingSize;
  /** Shorthand — sets both pt and pb when neither is specified explicitly */
  py?: SpacingSize;
  /** Optional section title rendered as an uppercase label above content */
  title?: string;
}

const SPACING: Record<SpacingSize, string> = {
  none: "0",
  xs:   "0.5rem",
  sm:   "1rem",
  md:   "1.5rem",
  lg:   "2rem",
  xl:   "3rem",
};

export default function Section({
  children,
  className = "",
  pt,
  pb,
  py = "md",
  title,
}: SectionProps) {
  const topSpacing = SPACING[pt ?? py];
  const bottomSpacing = SPACING[pb ?? py];

  return (
    <section
      className={["flex flex-col gap-3", className].filter(Boolean).join(" ")}
      style={{ paddingTop: topSpacing, paddingBottom: bottomSpacing }}
    >
      {title && (
        <p className="text-label tracking-widest text-white/50 uppercase">{title}</p>
      )}
      {children}
    </section>
  );
}
