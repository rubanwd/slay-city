"use client";

import { useState } from "react";

import { BottomNav, BOTTOM_NAV_CLEARANCE } from "@/components/layout";
import { CoinAmount, XpAmount } from "@/components/ui";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useImageLoaded } from "@/hooks/useImageLoaded";

import MapBackground from "./MapBackground";
import { MAP_ASPECT } from "./mapConstants";
import MapLocationNode from "./MapLocationNode";
import { MAX_VISIBLE_LOCATIONS, selectVisibleLocations } from "./mapState";
import type { MapDistrictViewModel } from "./mapState";

/** ‹ / › district stepper — the adults' stand-in for playing through the city. */
function StepButton({
  direction,
  onClick,
  disabled,
}: {
  direction: "previous" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${direction === "previous" ? "Previous" : "Next"} district`}
      className={[
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20",
        "text-lg font-black leading-none text-white/70 transition-colors",
        "hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent",
      ].join(" ")}
    >
      {direction === "previous" ? "‹" : "›"}
    </button>
  );
}

export interface CityMapPreviewProps {
  /** Published districts of the chosen level, in play order. */
  districts: MapDistrictViewModel[];
  /** Display name of the level being previewed, e.g. "Elementary". */
  levelName: string;
  /** Which console this is shown in — decides the bottom nav's tabs. */
  role: "parent" | "teacher";
  /** One-line explanation under the title, e.g. whose city this is. */
  subtitle: string;
}

/**
 * Read-only city map for the adult consoles: the same frame, artwork and
 * location labels children see on `/map`, with nothing to play.
 *
 * Two things make it a preview rather than the game screen. There is no
 * progress to render — an adult account has none — so no stop is ever
 * "completed" and there is no Start button, mascot or XP/coin HUD; and since
 * progress is also what walks a child from district to district, adults step
 * through the level's districts by hand with the pager below the title.
 *
 * Which level is shown comes from the viewer's own profile (Elementary by
 * default, changeable on their profile screen), so this always mirrors a real
 * child map for that level.
 */
export default function CityMapPreview({
  districts,
  levelName,
  role,
  subtitle,
}: CityMapPreviewProps) {
  const [districtIndex, setDistrictIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const district = districts[districtIndex] ?? null;
  const locations = selectVisibleLocations(district?.locations ?? [], MAX_VISIBLE_LOCATIONS);
  // Stepping to another district drops the previous selection automatically:
  // its id isn't in this district's list, so the first stop takes over.
  const selected = locations.find((location) => location.id === selectedId) ?? locations[0] ?? null;

  const backgroundUrl = district?.backgroundUrl ?? null;
  const backgroundLoaded = useImageLoaded(backgroundUrl);

  return (
    <main className="relative h-dvh bg-black flex flex-col overflow-hidden mx-auto w-full max-w-md md:border-x md:border-white/10">
      <header className="flex items-center justify-between gap-2 px-5 py-3 border-b border-white/10 shrink-0">
        <div className="min-w-0">
          <h1 className="text-lg font-black text-lime-green leading-tight uppercase">City Map</h1>
          <p className="truncate text-small text-white/50">{subtitle}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white whitespace-nowrap">
          {levelName}
        </span>
      </header>

      {districts.length === 0 ? (
        <section className={`flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center ${BOTTOM_NAV_CLEARANCE}`}>
          <h2 className="text-h3 font-bold text-white">Nothing to show yet</h2>
          <p className="max-w-xs text-small text-white/60">
            No districts have been published for {levelName} yet. They&apos;ll appear here as soon
            as the city grows.
          </p>
        </section>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-2 shrink-0">
            <StepButton
              direction="previous"
              onClick={() => setDistrictIndex((index) => Math.max(0, index - 1))}
              disabled={districtIndex === 0}
            />
            <div className="min-w-0 text-center">
              <p className="truncate text-body-strong font-black uppercase tracking-wide text-white">
                {district?.name}
              </p>
              <p className="text-label uppercase tracking-widest text-white/40">
                District {districtIndex + 1} of {districts.length}
              </p>
            </div>
            <StepButton
              direction="next"
              onClick={() =>
                setDistrictIndex((index) => Math.min(districts.length - 1, index + 1))
              }
              disabled={districtIndex === districts.length - 1}
            />
          </div>

          {/*
            Same coordinate space as the child map: a MAP_ASPECT-ratio frame
            with a blurred copy of the background filling the rest, so a pin
            lands on exactly the spot the child sees.
          */}
          <div className="relative flex-1 min-h-0 overflow-hidden">
            {backgroundUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={backgroundUrl}
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
                {backgroundUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={backgroundUrl}
                    alt=""
                    aria-hidden="true"
                    className={[
                      "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
                      backgroundLoaded ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                  />
                ) : (
                  <MapBackground />
                )}

                {locations.map((location) => (
                  <MapLocationNode
                    key={location.id}
                    name={location.name}
                    mapX={location.mapX}
                    mapY={location.mapY}
                    state="unlocked"
                    selected={location.id === selected?.id}
                    onSelect={() => setSelectedId(location.id)}
                  />
                ))}
              </div>
            </div>

            {backgroundUrl && !backgroundLoaded && (
              <FullScreenLoader fullScreen={false} label="Loading map…" />
            )}
          </div>

          <section
            className={`shrink-0 border-t border-white/10 px-5 pt-4 ${BOTTOM_NAV_CLEARANCE}`}
            aria-label="Selected location"
          >
            {selected ? (
              <>
                <div className="flex items-center justify-between gap-2 pb-1">
                  <h2 className="min-w-0 truncate text-base font-black text-white">
                    {selected.name}
                  </h2>
                  {selected.totalMissions > 0 && (
                    <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white/70 whitespace-nowrap">
                      {selected.totalMissions}{" "}
                      {selected.totalMissions === 1 ? "mission" : "missions"}
                    </span>
                  )}
                </div>

                {selected.description && (
                  <p className="line-clamp-2 text-small text-white/50">{selected.description}</p>
                )}

                {selected.totalMissions > 0 && (
                  <p className="flex items-center gap-2 pt-2 text-sm font-bold text-white/60">
                    <CoinAmount value={`+${selected.totalCoins}`} className="text-yellow-300" />
                    <span aria-hidden="true">·</span>
                    <XpAmount value={`+${selected.totalXp}`} />
                    <span>to earn here</span>
                  </p>
                )}
              </>
            ) : (
              <p className="text-small text-white/50">
                This district has no published locations yet.
              </p>
            )}
          </section>
        </>
      )}

      <BottomNav role={role} />
    </main>
  );
}
