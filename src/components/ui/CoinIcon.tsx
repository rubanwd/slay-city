export interface CoinIconProps {
  /**
   * Explicit pixel size. When omitted the coin scales to `1em`, so it lines up
   * with whatever font-size the surrounding text uses (inline in a pill, a
   * button, a reward card…).
   */
  size?: number;
  className?: string;
  /**
   * When set, the coin is announced to assistive tech with this label;
   * otherwise it is decorative (`aria-hidden`) and the surrounding text carries
   * the meaning.
   */
  title?: string;
}

/**
 * The Slay City coin — the single, canonical currency mark used everywhere a
 * coin balance, price, or coin reward appears (map HUD, wardrobe, shop prices,
 * reward screens). Deliberately flat and `<defs>`-free so it can be dropped in
 * any number of times on a page with no gradient-id collisions and rendered
 * from a server component.
 *
 * Design: a two-tone gold disc with an engraved rim, a lime-green brand star
 * embossed in the centre, and a soft top-left shine — distinct at a glance
 * from the cyan XP bolt ({@link XpIcon}) so the two currencies never blur.
 */
export default function CoinIcon({ size, className, title }: CoinIconProps) {
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

      {/* Disc: darker gold base + brighter face for a struck-metal depth. */}
      <circle cx="12" cy="12" r="11" fill="#E0A11B" />
      <circle cx="12" cy="12" r="9.2" fill="#FFCE45" />

      {/* Engraved inner ring. */}
      <circle
        cx="12"
        cy="12"
        r="8.2"
        fill="none"
        stroke="#E0A11B"
        strokeWidth="0.9"
        opacity="0.7"
      />

      {/* Brand star emblem (lime-green), with a subtle darker seat for emboss. */}
      <path
        d="M12 6.7l1.35 3.44 3.69.22-2.85 2.35.94 3.58L12 14.3l-3.12 1.99.94-3.58-2.85-2.35 3.69-.22z"
        fill="#7BB800"
        opacity="0.35"
        transform="translate(0,0.5)"
      />
      <path
        d="M12 6.7l1.35 3.44 3.69.22-2.85 2.35.94 3.58L12 14.3l-3.12 1.99.94-3.58-2.85-2.35 3.69-.22z"
        fill="rgb(var(--color-lime-green))"
      />

      {/* Top-left shine. */}
      <path
        d="M6.4 8.2a7.2 7.2 0 0 1 4.1-3.4"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.55"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
