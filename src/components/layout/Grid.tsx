import { type ReactNode } from "react";

type Cols = 1 | 2 | 3 | 4;
type Gap = "none" | "xs" | "sm" | "md" | "lg";

interface GridProps {
  children: ReactNode;
  className?: string;
  /** Number of columns. Defaults to 2. */
  cols?: Cols;
  /** Gap between cells. Defaults to "md". */
  gap?: Gap;
  /** Use CSS Grid instead of Flexbox (better for equal-height cards) */
  grid?: boolean;
}

const COLS_GRID: Record<Cols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

const COLS_FLEX: Record<Cols, string> = {
  1: "[&>*]:basis-full",
  2: "[&>*]:basis-[calc(50%-0.375rem)]",
  3: "[&>*]:basis-[calc(33.333%-0.5rem)]",
  4: "[&>*]:basis-[calc(25%-0.5625rem)]",
};

const GAP: Record<Gap, string> = {
  none: "gap-0",
  xs:   "gap-1",
  sm:   "gap-2",
  md:   "gap-3",
  lg:   "gap-4",
};

export default function Grid({
  children,
  className = "",
  cols = 2,
  gap = "md",
  grid = false,
}: GridProps) {
  const classes = grid
    ? ["grid", COLS_GRID[cols], GAP[gap], className]
    : ["flex flex-wrap", COLS_FLEX[cols], GAP[gap], className];

  return (
    <div className={classes.filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
