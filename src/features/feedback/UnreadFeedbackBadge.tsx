export interface UnreadFeedbackBadgeProps {
  count: number;
  className?: string;
}

/**
 * The unread marker beside the console's Feedback & Bugs entry — a cyan pill
 * with the number of reports this admin hasn't opened. Renders nothing when
 * there are none, so callers can drop it in unconditionally.
 */
export default function UnreadFeedbackBadge({ count, className }: UnreadFeedbackBadgeProps) {
  if (count <= 0) return null;

  const label = `${count} unread report${count === 1 ? "" : "s"}`;

  return (
    <span
      className={[
        "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-cyan px-1.5",
        "text-[11px] font-black leading-none text-black",
        className ?? "",
      ].join(" ")}
      aria-label={label}
      title={label}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
