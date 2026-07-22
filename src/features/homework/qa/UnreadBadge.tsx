export interface UnreadBadgeProps {
  count: number;
  /** Screen-reader label prefix, e.g. "3 unread messages". */
  className?: string;
}

/**
 * A small neon-pink pill showing the number of unread Q&A messages. Renders
 * nothing when there's nothing unread, so callers can drop it in unconditionally.
 */
export default function UnreadBadge({ count, className }: UnreadBadgeProps) {
  if (count <= 0) return null;
  return (
    <span
      className={[
        "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-neon-pink px-1.5",
        "text-[11px] font-bold leading-none text-white",
        className ?? "",
      ].join(" ")}
      aria-label={`${count} unread message${count === 1 ? "" : "s"}`}
      title={`${count} unread message${count === 1 ? "" : "s"}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
