import Link from "next/link";

import type { LocationState } from "./mapState";
import SlayCharacter from "./SlayCharacter";

export interface MapLocationNodeProps {
  name: string;
  mapX: number;
  mapY: number;
  state: LocationState;
  missionId: string | null;
}

const STATE_CLASSES: Record<LocationState, string> = {
  locked: "bg-white/5 border-2 border-white/10 text-white/30",
  unlocked:
    "bg-white/10 border-2 border-lime-green text-white shadow-[0_0_18px_2px_rgba(157,255,0,0.4)]",
  current: "bg-white/10 border-2 border-neon-pink text-white animate-glow",
  completed: "bg-lime-green/10 border-2 border-lime-green/60 text-white",
};

function NodeGlyph({ state }: { state: LocationState }) {
  if (state === "locked") return <span aria-hidden="true">🔒</span>;
  if (state === "completed") return <span aria-hidden="true">✓</span>;
  return <span aria-hidden="true">📍</span>;
}

export default function MapLocationNode({ name, mapX, mapY, state, missionId }: MapLocationNodeProps) {
  const interactive = missionId !== null && state !== "locked";

  const circle = (
    <div
      className={[
        "relative w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-transform",
        STATE_CLASSES[state],
        interactive ? "hover:scale-110 active:scale-95" : "",
      ].join(" ")}
    >
      {state === "current" && <SlayCharacter />}
      <NodeGlyph state={state} />
    </div>
  );

  return (
    <div
      className="absolute flex flex-col items-center gap-2 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${mapX}%`, top: `${mapY}%` }}
    >
      {interactive && missionId ? (
        <Link
          href={`/mission/${missionId}`}
          aria-label={`${name} — ${state}`}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-full"
        >
          {circle}
        </Link>
      ) : (
        <div aria-label={`${name} — locked`} aria-disabled="true">
          {circle}
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
