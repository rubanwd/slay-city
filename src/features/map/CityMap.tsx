"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BottomNav } from "@/components/layout";
import FullScreenLoader from "@/components/ui/FullScreenLoader";

import MapBackground from "./MapBackground";
import { MAP_ASPECT } from "./mapConstants";
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
  /** Mascot image for the current-location marker (equipped item or default). */
  mascotImageUrl: string;
}

export default function CityMap({ districts, hud, mascotImageUrl }: CityMapProps) {
  const locations = selectVisibleLocations(
    districts.flatMap((d) => d.locations),
    MAX_VISIBLE_LOCATIONS
  );
  const current = locations.find((l) => l.state === "current");
  // Which district the player is in right now — falls back to the closest
  // visible stop if every location is already completed.
  const activeLocation = current ?? locations[0];
  const activeDistrictName = activeLocation?.districtName;
  const activeBackgroundUrl = activeLocation?.districtBackgroundUrl ?? null;

  // Show a loader over the map area until the (large, remote) district
  // background image has fully decoded, so the player never sees a blank or
  // half-painted frame on first open. Preloading via an Image() reports load
  // reliably even when the file is already in cache (where a JSX onLoad can
  // miss). We track which URL finished loading so `bgLoaded` derives cleanly
  // and re-arms automatically whenever the background changes.
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const bgLoaded = !activeBackgroundUrl || loadedUrl === activeBackgroundUrl;
  useEffect(() => {
    if (!activeBackgroundUrl) return;
    const img = new Image();
    let cancelled = false;
    const done = () => {
      if (!cancelled) setLoadedUrl(activeBackgroundUrl);
    };
    img.onload = done;
    img.onerror = done;
    img.src = activeBackgroundUrl;
    if (img.complete) queueMicrotask(done);
    return () => {
      cancelled = true;
    };
  }, [activeBackgroundUrl]);

  return (
    <main className="h-dvh bg-black flex flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-5 py-3 border-b border-white/10 shrink-0">
        <h1 className="text-lg font-black text-lime-green leading-tight uppercase">Slay City</h1>
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

      {/*
        The coordinate space is a MAP_ASPECT-ratio frame — identical to the
        admin position picker — so a pin placed in the admin lands on the exact
        same spot here (WYSIWYG). A blurred copy of the background fills the rest
        of the screen so the frame never shows black bars.
      */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {activeBackgroundUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeBackgroundUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl opacity-40"
          />
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative w-full max-h-full overflow-hidden"
            style={{ aspectRatio: String(MAP_ASPECT) }}
          >
            {activeBackgroundUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeBackgroundUrl}
                alt=""
                aria-hidden="true"
                className={[
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
                  bgLoaded ? "opacity-100" : "opacity-0",
                ].join(" ")}
              />
            ) : (
              <MapBackground />
            )}

            {activeDistrictName && (
              <span
                className="absolute top-3 left-1/2 -translate-x-1/2 z-0 rounded-full bg-black/55 backdrop-blur px-4 py-1.5 text-sm font-extrabold uppercase tracking-[0.15em] text-white shadow-[0_0_14px_rgba(255,255,255,0.35)] pointer-events-none"
                aria-hidden="true"
              >
                {activeDistrictName}
              </span>
            )}

            {locations.map((loc) => (
              <MapLocationNode
                key={loc.id}
                name={loc.name}
                mapX={loc.mapX}
                mapY={loc.mapY}
                state={loc.state}
                missionId={loc.missionId}
                iconUrl={loc.iconUrl}
                mascotImageUrl={mascotImageUrl}
              />
            ))}
          </div>
        </div>

        {activeBackgroundUrl && !bgLoaded && (
          <FullScreenLoader fullScreen={false} label="Loading map…" />
        )}
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
