"use client";

import Link from "next/link";

import { BottomNav } from "@/components/layout";

import MapBackground from "./MapBackground";
import { MAX_VISIBLE_LOCATIONS, selectVisibleLocations } from "./mapState";
import type { MapDistrictViewModel } from "./mapState";
import MapLocationNode from "./MapLocationNode";

export interface HudStats {
  xp: number;
  coins: number;
  level: number;
  currentStreak: number;
}

export interface CityMapProps {
  districts: MapDistrictViewModel[];
  hud: HudStats;
}

/**
 * Horizontal zigzag (percent of map width), closest stop first. Hand-tuned
 * for up to MAX_VISIBLE_LOCATIONS stops so the path reads as a winding road
 * rather than a straight line, while keeping every stop clear of the edges.
 */
const X_PATTERN = [50, 76, 24, 68, 32, 50];
/** Vertical breathing room (percent of map height) around the end stops. */
const TOP_PADDING = 14;
const BOTTOM_PADDING = 12;

/** Position of stop `index` of `total`, as percentages of the map area. */
function stopPosition(index: number, total: number) {
  const x = X_PATTERN[index % X_PATTERN.length];
  const y =
    total <= 1
      ? 50
      : 100 - BOTTOM_PADDING - (index * (100 - TOP_PADDING - BOTTOM_PADDING)) / (total - 1);
  return { x, y };
}

export default function CityMap({ districts, hud }: CityMapProps) {
  const locations = selectVisibleLocations(
    districts.flatMap((d) => d.locations),
    MAX_VISIBLE_LOCATIONS
  );
  const current = locations.find((l) => l.state === "current");
  // Which district the player is in right now — falls back to the closest
  // visible stop if every location is already completed.
  const activeDistrictName = current?.districtName ?? locations[0]?.districtName;

  return (
    <main className="h-dvh bg-black flex flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-5 py-3 border-b border-white/10 shrink-0">
        <h1 className="text-lg font-black text-lime-green leading-tight uppercase">
          Slay City
        </h1>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 text-sm font-bold text-neon-pink">
            🔥 {hud.currentStreak}
          </span>
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 text-sm font-bold text-white whitespace-nowrap">
            Lvl {hud.level} · {hud.xp} XP
          </span>
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 text-sm font-bold text-yellow-400">
            🪙 {hud.coins}
          </span>
        </div>
      </header>

      <div className="relative flex-1 min-h-0">
        <MapBackground />

        {activeDistrictName && (
          <span
            className="absolute top-3 left-1/2 -translate-x-1/2 z-0 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/25 pointer-events-none"
            aria-hidden="true"
          >
            {activeDistrictName}
          </span>
        )}

        {locations.map((loc, i) => {
          const { x, y } = stopPosition(i, locations.length);
          return (
            <MapLocationNode
              key={loc.id}
              name={loc.name}
              mapX={x}
              mapY={y}
              state={loc.state}
              missionId={loc.missionId}
            />
          );
        })}
      </div>

      {current?.missionId && (
        <div className="px-5 pt-4 pb-24 border-t border-white/10 shrink-0">
          <Link
            href={`/mission/${current.missionId}`}
            className={[
              "flex items-center justify-center gap-2 w-full h-14 rounded-2xl",
              "bg-lime-green text-black font-extrabold uppercase tracking-wide text-lg",
              "hover:brightness-110 active:brightness-90 transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-green focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            ].join(" ")}
          >
            ▶ Start Today&apos;s Mission
          </Link>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
