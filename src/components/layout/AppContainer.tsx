import { type ReactNode } from "react";

interface AppContainerProps {
  children: ReactNode;
  className?: string;
  /** Remove horizontal padding — useful when content bleeds to edges (maps, full-bleed images) */
  flush?: boolean;
}

export default function AppContainer({ children, className = "", flush = false }: AppContainerProps) {
  return (
    <div
      className={[
        "w-full max-w-md mx-auto min-h-screen flex flex-col",
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
