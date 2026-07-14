import Link from "next/link";

import UiSlayCharacter from "@/components/ui/SlayCharacter";

import type { LocationState } from "./mapState";

export interface MapLocationNodeProps {
  name: string;
  /** Horizontal position, as a percentage of the map area's width. */
  mapX: number;
  /** Vertical position, as a percentage of the map area's height. */
  mapY: number;
  state: LocationState;
  missionId: string | null;
  /** Uploaded icon for this location; falls back to a themed emoji when absent. */
  iconUrl?: string | null;
}

const STATE_CLASSES: Record<LocationState, string> = {
  locked: "bg-white/5 border-2 border-white/10 text-white/30",
  unlocked:
    "bg-black/40 border-2 border-lime-green text-white shadow-[0_0_18px_2px_rgba(157,255,0,0.4)]",
  current: "bg-black/40 border-2 border-neon-pink text-white animate-glow",
  completed: "bg-lime-green/10 border-2 border-lime-green/60 text-white",
};

/** Themed picture for each location, keyed by its name. */
const LOCATION_EMOJI: Record<string, string> = {
  "Market Square": "🛒",
  "In the Kitchen": "🍳",
  "Cozy Café": "☕",
  Classroom: "📚",
  "Art Studio": "🎨",
};

function nodeImage(name: string, state: LocationState): string {
  if (state === "locked") return "🔒";
  return LOCATION_EMOJI[name] ?? "📍";
}

export default function MapLocationNode({
  name,
  mapX,
  mapY,
  state,
  missionId,
  iconUrl,
}: MapLocationNodeProps) {
  const interactive = missionId !== null && state !== "locked";
  // A custom icon replaces the emoji for any non-locked state (locked always
  // shows the 🔒 so it reads as unavailable).
  const showIcon = iconUrl && state !== "locked";

  const marker =
    state === "current" ? (
      <div className={interactive ? "transition-transform hover:scale-110 active:scale-95" : ""}>
        <UiSlayCharacter size="sm" wiggle aria-label={`${name} — you are here`} />
      </div>
    ) : (
      <div
        className={[
          "relative w-[clamp(3.25rem,11vmin,5rem)] h-[clamp(3.25rem,11vmin,5rem)] rounded-full flex items-center justify-center text-[clamp(1.5rem,5vmin,2.25rem)] transition-transform",
          STATE_CLASSES[state],
          interactive ? "hover:scale-110 active:scale-95" : "",
        ].join(" ")}
      >
        {showIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconUrl} alt="" aria-hidden="true" className="h-full w-full rounded-full object-cover" />
        ) : (
          <span aria-hidden="true" className={state === "locked" ? "opacity-70" : ""}>
            {nodeImage(name, state)}
          </span>
        )}

        {state === "completed" && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-lime-green text-black text-sm font-black flex items-center justify-center border-2 border-black"
          >
            ✓
          </span>
        )}
      </div>
    );

  return (
    <div
      className="absolute z-10 flex flex-col items-center gap-1.5 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${mapX}%`, top: `${mapY}%` }}
    >
      {interactive && missionId ? (
        <Link
          href={`/mission/${missionId}`}
          aria-label={`${name} — ${state}`}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-full"
        >
          {marker}
        </Link>
      ) : (
        <div aria-label={`${name} — locked`} aria-disabled="true">
          {marker}
        </div>
      )}

      <span
        className={[
          "max-w-[26vw] text-center break-words text-[clamp(0.6rem,2.2vmin,0.75rem)] font-semibold uppercase leading-tight tracking-wide px-2 py-1 rounded-lg bg-black/60",
          state === "locked" ? "text-white/30" : "text-white/80",
        ].join(" ")}
      >
        {name}
      </span>
    </div>
  );
}
