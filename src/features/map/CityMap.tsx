"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { BottomNav } from "@/components/layout";

import MapBackground from "./MapBackground";
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

/** Vertical gap between consecutive stops on the path, in pixels. */
const ROW_HEIGHT = 150;
/** Breathing room above the topmost stop and below the closest one. */
const TOP_PADDING = 110;
const BOTTOM_PADDING = 70;
/** Horizontal zigzag: closest stop centered, then alternating left/right. */
const X_PATTERN = [50, 28, 72];

export default function CityMap({ districts, hud }: CityMapProps) {
  const locations = districts.flatMap((d) => d.locations);
  const current = locations.find((l) => l.state === "current");
  const scrollRef = useRef<HTMLDivElement>(null);

  const pathHeight =
    locations.length > 0
      ? TOP_PADDING + (locations.length - 1) * ROW_HEIGHT + BOTTOM_PADDING
      : 0;

  // The path is ordered closest-first; closest sits at the bottom, so scroll
  // there by default instead of dropping the player at the far, locked end.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  return (
    <main className="h-screen bg-black flex flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-5 py-4 border-b border-white/10">
        <h1 className="text-lg font-black text-lime-green leading-tight uppercase">
          Slay
          <br />
          City
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

      <div ref={scrollRef} className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="relative" style={{ height: pathHeight }}>
          <MapBackground />

          {locations.length > 1 && (
            <svg
              className="absolute inset-0 w-full pointer-events-none"
              height={pathHeight}
              viewBox={`0 0 100 ${pathHeight}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polyline
                points={locations
                  .map((_, i) => {
                    const x = X_PATTERN[i % X_PATTERN.length];
                    const y = pathHeight - BOTTOM_PADDING - i * ROW_HEIGHT;
                    return `${x},${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#9DFF00"
                strokeWidth={1.2}
                strokeOpacity={0.7}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}

          {locations.map((loc, i) => (
            <MapLocationNode
              key={loc.id}
              name={loc.name}
              mapX={X_PATTERN[i % X_PATTERN.length]}
              mapYPx={pathHeight - BOTTOM_PADDING - i * ROW_HEIGHT}
              state={loc.state}
              missionId={loc.missionId}
            />
          ))}
        </div>
      </div>

      {current?.missionId && (
        <div className="px-5 pt-5 pb-24 border-t border-white/10">
          <Link
            href={`/mission/${current.missionId}`}
            className={[
              "flex items-center justify-center gap-2 w-full h-16 rounded-2xl",
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
