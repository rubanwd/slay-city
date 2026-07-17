"use client";

import type { LocationState } from "./mapState";

export interface MapLocationNodeProps {
  name: string;
  /** Horizontal position, as a percentage of the map area's width. */
  mapX: number;
  /** Vertical position, as a percentage of the map area's height. */
  mapY: number;
  state: LocationState;
  /** The mascot currently stands here; tapping Start plays this stop. */
  selected: boolean;
  onSelect: () => void;
}

/**
 * A location on the map, drawn as just its name — the district background art
 * already paints the building itself, so no marker or icon is layered on top.
 * The label floats gently (staggered per-location so the map feels alive) and
 * lights up pink when selected; the mascot hovers above the selected one.
 */
export default function MapLocationNode({
  name,
  mapX,
  mapY,
  state,
  selected,
  onSelect,
}: MapLocationNodeProps) {
  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${mapX}%`, top: `${mapY}%` }}
    >
      {/* Float lives on a wrapper: its transform would otherwise clobber the
          button's hover scale, and the centering translate above. */}
      <div
        className="animate-label-float"
        style={{ animationDelay: `${((mapX + mapY) % 5) * 0.4}s` }}
      >
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={`${name}${state === "completed" ? " — completed" : ""}`}
          className={[
            "max-w-[38vw] break-words rounded-full px-3.5 py-1.5 text-center",
            "text-[clamp(0.65rem,2.4vmin,0.85rem)] font-extrabold uppercase leading-tight tracking-wide",
            "backdrop-blur-sm transition-transform hover:scale-110 active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            selected
              ? "bg-black/70 border-2 border-neon-pink text-white animate-glow"
              : state === "completed"
                ? "bg-black/55 border-2 border-lime-green/50 text-lime-green"
                : "bg-black/55 border-2 border-white/25 text-white shadow-[0_0_14px_rgba(157,255,0,0.35)]",
          ].join(" ")}
        >
          {state === "completed" ? `✓ ${name}` : name}
        </button>
      </div>
    </div>
  );
}
