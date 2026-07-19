"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import { BottomNav, BOTTOM_NAV_CLEARANCE } from "@/components/layout";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useImageLoaded } from "@/hooks/useImageLoaded";
import { resetLocationProgress } from "@/features/mission/actions";

import MapBackground from "./MapBackground";
import { MAP_ASPECT } from "./mapConstants";
import { defaultSelectedLocation, MAX_VISIBLE_LOCATIONS, selectVisibleLocations } from "./mapState";
import type { MapDistrictViewModel } from "./mapState";
import MapLocationNode from "./MapLocationNode";
import MascotMarker from "./MascotMarker";

function RestartLocationButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Restart location"
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-white/20 text-white/70 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 12a9 9 0 1 1 2.6 6.4" />
        <polyline points="3 17 3 12 8 12" />
      </svg>
    </button>
  );
}

export interface HudStats {
  xp: number;
  coins: number;
  level: number;
  currentStreak: number;
}

export interface CityMapProps {
  /** The district the player is currently in (see selectActiveDistrict). */
  district: MapDistrictViewModel | null;
  hud: HudStats;
  /** Mascot image for the you-are-here marker (equipped item or default). */
  mascotImageUrl: string;
}

export default function CityMap({ district, hud, mascotImageUrl }: CityMapProps) {
  const locations = selectVisibleLocations(district?.locations ?? [], MAX_VISIBLE_LOCATIONS);

  // The mascot starts on the earliest stop that still has a mission; tapping
  // any node walks it there and retargets the Start button below the map.
  const [selectedId, setSelectedId] = useState<string | null>(
    () => defaultSelectedLocation(locations)?.id ?? null
  );
  // Falls back to the frontier when the picked stop disappears from the
  // window (e.g. data refreshed underneath the open map).
  const selected =
    locations.find((l) => l.id === selectedId) ?? defaultSelectedLocation(locations);

  const activeBackgroundUrl = district?.backgroundUrl ?? null;

  // Hold a loader over the map area until the (large, remote) district
  // background has decoded, so the player never sees a blank or half-painted
  // frame on first open.
  const bgLoaded = useImageLoaded(activeBackgroundUrl);

  return (
    <main className="h-dvh bg-black flex flex-col overflow-hidden mx-auto w-full max-w-md md:border-x md:border-white/10">
      <header className="flex items-center justify-between gap-2 px-5 py-3 border-b border-white/10 shrink-0">
        <h1 className="text-lg font-black text-lime-green leading-tight uppercase">Slay City</h1>
        <div className="flex items-center gap-2">
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

        <div className="absolute inset-0 flex items-start justify-center">
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

            {district && (
              <span
                className="absolute top-3 left-1/2 -translate-x-1/2 z-0 rounded-full bg-black/55 backdrop-blur px-4 py-1.5 text-sm font-extrabold uppercase tracking-[0.15em] text-white shadow-[0_0_14px_rgba(255,255,255,0.35)] pointer-events-none"
                aria-hidden="true"
              >
                {district.name}
              </span>
            )}

            {locations.map((loc) => (
              <MapLocationNode
                key={loc.id}
                name={loc.name}
                mapX={loc.mapX}
                mapY={loc.mapY}
                state={loc.state}
                selected={loc.id === selected?.id}
                onSelect={() => setSelectedId(loc.id)}
              />
            ))}

            {selected && (
              <MascotMarker mapX={selected.mapX} mapY={selected.mapY} imageUrl={mascotImageUrl} />
            )}
          </div>
        </div>

        {activeBackgroundUrl && !bgLoaded && (
          <FullScreenLoader fullScreen={false} label="Loading map…" />
        )}
      </div>

      {selected && (
        <div
          className={`px-5 pt-4 ${BOTTOM_NAV_CLEARANCE} border-t border-white/10 shrink-0`}
        >
          {selected.missionId ? (
            <Link
              href={`/mission/${selected.missionId}`}
              className={[
                "flex items-center justify-center gap-2 w-full h-14 rounded-2xl",
                "bg-lime-green text-black font-extrabold uppercase tracking-wide text-lg",
                "hover:brightness-110 active:brightness-90 transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-green focus-visible:ring-offset-2 focus-visible:ring-offset-black",
              ].join(" ")}
            >
              <span className="truncate">▶ Start {selected.name}</span>
            </Link>
          ) : selected.state === "completed" ? (
            <div className="flex flex-col gap-2">
              <p className="text-center text-sm font-bold text-white/60">
                🪙 +{selected.totalCoins} · ⭐ +{selected.totalXp} earned
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="flex flex-1 min-w-0 items-center justify-center gap-2 h-14 rounded-2xl border-2 border-lime-green/40 text-lime-green/70 font-extrabold uppercase tracking-wide text-lg"
                  aria-disabled="true"
                >
                  <span className="truncate">✓ {selected.name} completed</span>
                </div>
                <form
                  action={async () => {
                    const result = await resetLocationProgress(selected.id);
                    if (!result.ok) window.alert(result.error);
                  }}
                  onSubmit={(event) => {
                    if (
                      !window.confirm(
                        `Restart ${selected.name}? You'll replay every mission here from the start.`
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  <RestartLocationButton />
                </form>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl border-2 border-lime-green/40 text-lime-green/70 font-extrabold uppercase tracking-wide text-lg"
              aria-disabled="true"
            >
              <span className="truncate">Coming soon</span>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
