"use client";

import Link from "next/link";
import { useState } from "react";

import { BottomNav, BOTTOM_NAV_CLEARANCE } from "@/components/layout";
import { CoinAmount, XpAmount } from "@/components/ui";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { DEFAULT_LOCALE, getMessages, type Locale } from "@/features/i18n";
import { useImageLoaded } from "@/hooks/useImageLoaded";

import MapBackground from "./MapBackground";
import { MAP_ASPECT } from "./mapConstants";
import MapLocationNode from "./MapLocationNode";
import {
  defaultPreviewDistrictIndex,
  isDistrictCompleted,
  MAX_VISIBLE_LOCATIONS,
  selectVisibleLocations,
} from "./mapState";
import type { MapDistrictViewModel } from "./mapState";

/** ‹ / › district stepper — the adults' stand-in for playing through the city. */
function StepButton({
  direction,
  label,
  onClick,
  disabled,
}: {
  direction: "previous" | "next";
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
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
  /**
   * Whose progress the ✓ marks and mission counts reflect — a student's name, or
   * similar. Null when no progress is tracked (no student linked yet, or a
   * console that deliberately shows none), and then the map is content only.
   */
  progressLabel?: string | null;
  /**
   * Turns the selected stop into a link to `${locationHrefBase}/<locationId>`.
   * Set on the teacher console, where a stop opens its list of missions to run;
   * left unset for the parent, whose map is purely something to look at.
   */
  locationHrefBase?: string | null;
  /**
   * Language for this screen's own copy. The parent console passes the parent's
   * language; the teacher console omits it and gets English. Only the wording
   * around the map changes — district, location and mission names are authored
   * content and always render as written.
   */
  locale?: Locale;
}

/**
 * City map for the adult consoles: the same frame, artwork and location labels
 * students see on `/map`, but never a game.
 *
 * What makes it a preview: no mascot, no XP/coin HUD, and no progress of the
 * viewer's own — a parent instead sees their student's (see `loadMapPreview`),
 * and a teacher sees none at all. Since it is a student's own progress that walks
 * them from district to district, adults step through the level's districts by
 * hand with the pager below the title; it opens on the first district the
 * followed players have not finished.
 *
 * With `locationHrefBase` the selected stop becomes a way in — the teacher
 * console uses it to open a location's missions and play through them in review
 * mode. Without it, the panel just describes the stop.
 *
 * Which level is shown is the caller's decision: the parent console follows the
 * level their student picked, the teacher console their own — either way this
 * mirrors a real student map for that level.
 */
export default function CityMapPreview({
  districts,
  levelName,
  role,
  subtitle,
  progressLabel = null,
  locationHrefBase = null,
  locale = DEFAULT_LOCALE,
}: CityMapPreviewProps) {
  // Resolved here rather than passed in: several of these messages take a count
  // only this component knows, and a function cannot cross the server → client
  // boundary as a prop.
  const messages = getMessages(locale);
  const strings = messages.map;

  const [districtIndex, setDistrictIndex] = useState(() =>
    defaultPreviewDistrictIndex(districts)
  );
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
          <h1 className="text-lg font-black text-lime-green leading-tight uppercase">
            {strings.title}
          </h1>
          <p className="truncate text-small text-white/50">{subtitle}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white whitespace-nowrap">
          {levelName}
        </span>
      </header>

      {districts.length === 0 ? (
        <section className={`flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center ${BOTTOM_NAV_CLEARANCE}`}>
          <h2 className="text-h3 font-bold text-white">{strings.nothingTitle}</h2>
          <p className="max-w-xs text-small text-white/60">{strings.nothingBody(levelName)}</p>
        </section>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-2 shrink-0">
            <StepButton
              direction="previous"
              label={strings.previousDistrict}
              onClick={() => setDistrictIndex((index) => Math.max(0, index - 1))}
              disabled={districtIndex === 0}
            />
            <div className="min-w-0 text-center">
              <p className="truncate text-body-strong font-black uppercase tracking-wide text-white">
                {district && isDistrictCompleted(district) && (
                  <span className="text-lime-green">✓ </span>
                )}
                {district?.name}
              </p>
              <p className="text-label uppercase tracking-widest text-white/40">
                {strings.districtOf(districtIndex + 1, districts.length)}
              </p>
            </div>
            <StepButton
              direction="next"
              label={strings.nextDistrict}
              onClick={() =>
                setDistrictIndex((index) => Math.min(districts.length - 1, index + 1))
              }
              disabled={districtIndex === districts.length - 1}
            />
          </div>

          {progressLabel && (
            <p className="shrink-0 border-b border-white/10 px-5 py-1.5 text-center text-label uppercase tracking-widest text-lime-green/80">
              {strings.completedBy(progressLabel)}
            </p>
          )}

          {/*
            Same coordinate space as the student map: a MAP_ASPECT-ratio frame
            with a blurred copy of the background filling the rest, so a pin
            lands on exactly the spot the student sees.
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
                    state={location.state}
                    selected={location.id === selected?.id}
                    onSelect={() => setSelectedId(location.id)}
                  />
                ))}
              </div>
            </div>

            {backgroundUrl && !backgroundLoaded && (
              <FullScreenLoader fullScreen={false} label={strings.loadingMap} />
            )}
          </div>

          <section
            className={`shrink-0 border-t border-white/10 px-5 pt-4 ${BOTTOM_NAV_CLEARANCE}`}
            aria-label={strings.selectedLocation}
          >
            {selected ? (
              <>
                <div className="flex items-center justify-between gap-2 pb-1">
                  <h2 className="min-w-0 truncate text-base font-black text-white">
                    {selected.name}
                  </h2>
                  {selected.totalMissions > 0 && (
                    <span
                      className={[
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap",
                        selected.state === "completed"
                          ? "bg-lime-green/15 text-lime-green"
                          : "bg-white/10 text-white/70",
                      ].join(" ")}
                    >
                      {/* Without followed players every count would read "0 of n" — misleading,
                          since nobody's progress is being shown at all. */}
                      {progressLabel
                        ? strings.missionsProgress(
                            selected.missionsCompleted,
                            selected.totalMissions
                          )
                        : strings.missionsCount(selected.totalMissions)}
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
                    <span>
                      {selected.state === "completed" ? strings.earnedHere : strings.toEarnHere}
                    </span>
                  </p>
                )}

                {locationHrefBase && (
                  <Link
                    href={`${locationHrefBase}/${selected.id}`}
                    className={[
                      "mt-3 flex h-14 items-center justify-center gap-2 rounded-2xl",
                      "bg-lime-green text-black font-extrabold uppercase tracking-wide text-lg",
                      "hover:brightness-110 active:brightness-90 transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-green focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                    ].join(" ")}
                  >
                    <span className="truncate">
                      {selected.totalMissions > 0 ? strings.openMissions : strings.openLocation}
                    </span>
                  </Link>
                )}
              </>
            ) : (
              <p className="text-small text-white/50">{strings.noLocations}</p>
            )}
          </section>
        </>
      )}

      <BottomNav
        role={role}
        labels={{
          dashboard: messages.nav.dashboard,
          map: messages.nav.map,
          profile: messages.nav.profile,
        }}
      />
    </main>
  );
}
