export interface ShareIconProps {
  /**
   * Explicit pixel size. When omitted the icon scales to `1em`, so it lines
   * up with whatever font-size the surrounding text uses (inline in an
   * instruction sentence, a button…).
   */
  size?: number;
  className?: string;
  title?: string;
}

/**
 * The iOS "Share" glyph — an upward arrow escaping an open-top box. Used to
 * point at Safari's share-sheet button when walking a user through the
 * manual "Add to Home Screen" flow, since iOS exposes no installable-PWA API
 * to trigger that flow programmatically.
 */
export default function ShareIcon({ size, className, title }: ShareIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={size ? undefined : { width: "1em", height: "1em" }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title ? <title>{title}</title> : null}
      <path d="M12 3v12" />
      <path d="M7.5 7.5L12 3l4.5 4.5" />
      <path d="M5 11v7.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V11" />
    </svg>
  );
}
