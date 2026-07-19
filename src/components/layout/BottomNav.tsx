"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* ── Tab icons — small, single-purpose SVGs; not worth a shared icon lib. ──── */

function MapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z" />
      <path d="M9 4v13" />
      <path d="M15 6.5v13" />
    </svg>
  );
}

function WardrobeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a2 2 0 0 0-2 2c0 1 .8 1.7 2 2.2" />
      <path d="M12 7.2 3.5 13.5a1 1 0 0 0 .6 1.8h15.8a1 1 0 0 0 .6-1.8L12 7.2z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  );
}

type NavItem = {
  label: string;
  href: string;
  icon: () => React.ReactElement;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Map", href: "/map", icon: MapIcon },
  { label: "Wardrobe", href: "/wardrobe", icon: WardrobeIcon },
  { label: "Profile", href: "/profile", icon: ProfileIcon },
];

/**
 * Bottom padding a page's scrollable content needs so the fixed nav — tab row
 * (~79px) plus the watermark strip (38px of text + 20px of reserved space) —
 * never covers it. Kept here so the child screens stay in sync when the bar's
 * height changes.
 */
export const BOTTOM_NAV_CLEARANCE = "pb-[170px]";

const WATERMARK_TEXT = "Slay School";

/** How far each letter's flash trails the one before it — the sweep speed. */
const WATERMARK_STAGGER_MS = 55;

/**
 * Watermark strip pinned below the tab bar, at the very bottom of the screen.
 * The wordmark is drawn as SVG so it stretches to exactly 70% of the screen
 * width regardless of font size or viewport.
 *
 * Each letter is its own tspan running the same 7s brighten-and-fade, offset by
 * a growing animation-delay, so the highlight reads as a beam of light sweeping
 * left to right rather than the whole word blinking at once. The space is a
 * non-breaking space because SVG would otherwise collapse a lone whitespace
 * tspan.
 *
 * The 20px of reserved space below the text is what keeps the wordmark clear of
 * the iPhone home indicator. `env(safe-area-inset-bottom)` alone can't do that
 * job here: it only reports a real value under `viewport-fit=cover`, and turning
 * that on made the rest of the layout worse on device — so we take the max of
 * the two and always keep a floor.
 */
function BrandWatermark() {
  return (
    <div className="h-[38px] pb-[max(env(safe-area-inset-bottom),20px)] box-content flex items-center justify-center bg-white/[0.06] pointer-events-none">
      <svg
        viewBox="0 0 700 100"
        preserveAspectRatio="xMidYMid meet"
        className="w-[70%] h-full"
        aria-hidden="true"
      >
        <text
          x="350"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          textLength="700"
          lengthAdjust="spacingAndGlyphs"
          fontSize="80"
          fontWeight="900"
          letterSpacing="4"
          fill="#fff"
          fillOpacity={0.2}
        >
          {[...WATERMARK_TEXT].map((char, index) => (
            <tspan
              key={`${char}-${index}`}
              className="watermark-breathe"
              style={{ animationDelay: `${index * WATERMARK_STAGGER_MS}ms` }}
            >
              {char === " " ? " " : char}
            </tspan>
          ))}
        </text>
      </svg>
    </div>
  );
}

/**
 * Fixed bottom navigation shown on the main in-app (child) screens: map,
 * wardrobe, profile. Includes the Slay School watermark strip beneath the tabs,
 * so pages need `BOTTOM_NAV_CLEARANCE` worth of bottom padding on their
 * scrollable content to stay clear of the whole bar. Active tab is the first
 * item whose href matches the current path.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const activeIndex = NAV_ITEMS.findIndex(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-white/10 bg-black/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:border-x">
      <nav aria-label="Primary">
        <ul className="flex items-stretch justify-around px-2 py-2">
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const active = index === activeIndex;
          return (
            <li key={item.label} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex flex-col items-center gap-1 rounded-xl py-1",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-green focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    active ? "bg-lime-green text-black" : "text-white/50",
                  ].join(" ")}
                >
                  <Icon />
                </span>
                <span
                  className={[
                    "text-[11px] font-semibold leading-none transition-colors",
                    active ? "text-lime-green" : "text-white/50",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
        </ul>
      </nav>
      <BrandWatermark />
    </div>
  );
}
