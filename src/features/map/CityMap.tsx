"use client";

import Link from "next/link";

import UserMenu from "@/features/auth/UserMenu";

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

export default function CityMap({ districts, hud }: CityMapProps) {
  const current = districts.flatMap((d) => d.locations).find((l) => l.state === "current");

  return (
    <main className="min-h-screen bg-black flex flex-col">
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
          <UserMenu className="ml-1" />
        </div>
      </header>

      <div className="relative flex-1 min-h-[520px] overflow-hidden">
        <MapBackground />

        {districts
          .flatMap((district) => district.locations)
          .map((loc) => (
            <MapLocationNode
              key={loc.id}
              name={loc.name}
              mapX={loc.mapX}
              mapY={loc.mapY}
              state={loc.state}
              missionId={loc.missionId}
            />
          ))}
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
    </main>
  );
}
