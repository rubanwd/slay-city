export interface XpIconProps {
  /** Explicit pixel size; when omitted the icon scales to `1em`. */
  size?: number;
  className?: string;
  /** Accessible label; when omitted the icon is decorative (`aria-hidden`). */
  title?: string;
}

/**
 * The XP mark — a cyan progression bolt. XP is *earned* progress (it fills the
 * level bar), deliberately drawn as a lightning bolt so it never reads as a
 * spendable coin ({@link CoinIcon}). Colour comes from `currentColor`, so set
 * `text-cyan` (or any colour) on the element that renders it.
 */
export default function XpIcon({ size, className, title }: XpIconProps) {
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
    >
      {title ? <title>{title}</title> : null}
      <path d="M13.2 2L4 13.4h5.4L8.4 22 20 9.6h-5.9z" fill="currentColor" />
    </svg>
  );
}
