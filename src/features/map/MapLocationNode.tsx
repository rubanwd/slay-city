import Link from "next/link";

import UiSlayCharacter from "@/components/ui/SlayCharacter";

import type { LocationState } from "./mapState";

export interface MapLocationNodeProps {
  name: string;
  mapX: number;
  /** Vertical position from the top of the scrollable path, in pixels. */
  mapYPx: number;
  state: LocationState;
  missionId: string | null;
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

export default function MapLocationNode({ name, mapX, mapYPx, state, missionId }: MapLocationNodeProps) {
  const interactive = missionId !== null && state !== "locked";

  const marker =
    state === "current" ? (
      <div className={interactive ? "transition-transform hover:scale-110 active:scale-95" : ""}>
        <UiSlayCharacter size="sm" wiggle aria-label={`${name} — you are here`} />
      </div>
    ) : (
      <div
        className={[
          "relative w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-transform",
          STATE_CLASSES[state],
          interactive ? "hover:scale-110 active:scale-95" : "",
        ].join(" ")}
      >
        <span aria-hidden="true" className={state === "locked" ? "opacity-70" : ""}>
          {nodeImage(name, state)}
        </span>

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
      className="absolute z-10 flex flex-col items-center gap-2 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${mapX}%`, top: `${mapYPx}px` }}
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
          "text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-lg bg-black/60 whitespace-nowrap",
          state === "locked" ? "text-white/30" : "text-white/80",
        ].join(" ")}
      >
        {name}
      </span>
    </div>
  );
}
