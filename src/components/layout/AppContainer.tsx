import { type ReactNode } from "react";

interface AppContainerProps {
  children: ReactNode;
  className?: string;
  /** Remove horizontal padding — useful when content bleeds to edges (maps, full-bleed images) */
  flush?: boolean;
  /**
   * Lock to the viewport height and disable page scroll instead of growing
   * with content — for screens (like a game) that must always fit in one
   * view. Children are responsible for making their own flexible areas
   * shrink to fit (`flex-1 min-h-0`).
   */
  fixedHeight?: boolean;
}

export default function AppContainer({
  children,
  className = "",
  flush = false,
  fixedHeight = false,
}: AppContainerProps) {
  return (
    <div
      className={[
        "w-full max-w-md mx-auto flex flex-col",
        fixedHeight ? "h-dvh overflow-hidden" : "min-h-screen",
        "bg-black text-white",
        flush ? "" : "px-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
