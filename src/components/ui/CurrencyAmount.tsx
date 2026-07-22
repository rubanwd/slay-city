import CoinIcon from "./CoinIcon";
import XpIcon from "./XpIcon";

export interface CurrencyAmountProps {
  /** The number to show. Pass a preformatted string for signed values ("+30"). */
  value: number | string;
  /**
   * Extra classes for the wrapper — set the text colour and font-size here; the
   * icon scales to the text via `1em`. Defaults keep coins gold and XP cyan.
   */
  className?: string;
  /** Accessible label for the whole amount, e.g. "49 coins". */
  label?: string;
}

const BASE = "inline-flex items-center gap-1 font-bold whitespace-nowrap tabular-nums";

/**
 * A coin balance / price / reward, rendered as the canonical Slay City coin
 * followed by the amount. The single place inline coin amounts are composed, so
 * every screen shows the same icon, gap, and alignment.
 */
export function CoinAmount({ value, className, label }: CurrencyAmountProps) {
  return (
    <span className={[BASE, className].filter(Boolean).join(" ")} aria-label={label}>
      <CoinIcon />
      <span aria-hidden={label ? true : undefined}>{value}</span>
    </span>
  );
}

/**
 * An XP amount, rendered as the cyan XP bolt followed by the amount. Mirrors
 * {@link CoinAmount} so coins and XP stay visually parallel but never identical.
 */
export function XpAmount({ value, className, label }: CurrencyAmountProps) {
  return (
    <span
      className={[BASE, "text-cyan", className].filter(Boolean).join(" ")}
      aria-label={label}
    >
      <XpIcon />
      <span aria-hidden={label ? true : undefined}>{value}</span>
    </span>
  );
}
