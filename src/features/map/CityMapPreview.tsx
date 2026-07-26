"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type MouseEvent } from "react";

import { BottomNav, BOTTOM_NAV_CLEARANCE } from "@/components/layout";
import { CoinAmount, XpAmount } from "@/components/ui";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { DEFAULT_LOCALE, getMessages, type Locale } from "@/features/i18n";
import { useImageLoaded } from "@/hooks/useImageLoaded";

import { moveLocationOnMap } from "./actions";
import MapBackground from "./MapBackground";
import { MAP_ASPECT } from "./mapConstants";
import MapLocationNode from "./MapLocationNode";
import {
  defaultPreviewDistrictIndex,
  isDistrictCompleted,
  MAX_VISIBLE_LOCATIONS,
  selectVisibleLocations,
} from "./mapState";
import type { MapDistrictViewModel, MapLocationViewModel } from "./mapState";

/** A map coordinate is a percentage of the frame, rounded like the admin picker. */
function toMapPercent(offset: number, size: number): number {
  const percent = Math.round(((offset / size) * 100) * 10) / 10;
  return Math.min(100, Math.max(0, percent));
}

/** Where a label sits right now, once a pending move has been applied to it. */
type MovedPositions = Record<string, { x: number; y: number }>;

function applyMoves(
  locations: MapLocationViewModel[],
  moved: MovedPositions
): MapLocationViewModel[] {
  return locations.map((location) => {
    const position = moved[location.id];
    return position ? { ...location, mapX: position.x, mapY: position.y } : location;
  });
}

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
  /**
   * Adds a Move button to the selected stop, which lets the viewer drop its
   * label anywhere on the map. Set on the teacher console — teachers review
   * every district here and are the ones who spot a label covering the artwork
   * it names. The database decides who may actually save the new spot
   * (`set_location_map_position`); this only offers the button.
   */
  canMoveLocations?: boolean;
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
  canMoveLocations = false,
}: CityMapPreviewProps) {
  // Resolved here rather than passed in: several of these messages take a count
  // only this component knows, and a function cannot cross the server → client
  // boundary as a prop.
  const messages = getMessages(locale);
  const strings = messages.map;

  const [districtIndex, setDistrictIndex] = useState(() =>
    defaultPreviewDistrictIndex(districts)
  );
  // Three states, not two: `undefined` lets the district's first stop stand in
  // (the map should never open on an empty panel), while `null` means the
  // selection was deliberately cleared — which is where a finished move leaves
  // things, so nothing is lit up over the label's new home.
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
  // The stop whose label is being repositioned; the next tap on the map lands it.
  const [movingId, setMovingId] = useState<string | null>(null);
  // New positions held locally so a moved label jumps under the finger straight
  // away, rather than after the server round trip and revalidation.
  const [moved, setMoved] = useState<MovedPositions>({});
  const [moveFailed, setMoveFailed] = useState(false);
  const [, startSaving] = useTransition();
  const frameRef = useRef<HTMLDivElement>(null);

  const district = districts[districtIndex] ?? null;
  const locations = applyMoves(
    selectVisibleLocations(district?.locations ?? [], MAX_VISIBLE_LOCATIONS),
    moved
  );
  const selected =
    selectedId === null
      ? null
      : locations.find((location) => location.id === selectedId) ?? locations[0] ?? null;
  const moving = movingId ? locations.find((location) => location.id === movingId) ?? null : null;

  const backgroundUrl = district?.backgroundUrl ?? null;
  const backgroundLoaded = useImageLoaded(backgroundUrl);

  /** Steps to another district and starts it over: first stop, no move in flight. */
  function showDistrict(nextIndex: number) {
    setDistrictIndex(nextIndex);
    setSelectedId(undefined);
    setMovingId(null);
  }

  /**
   * Drops the label being moved wherever the map was tapped, then leaves the map
   * with nothing selected so the teacher can see the new arrangement plainly.
   * The save runs behind that; if it fails the label snaps back to its stored
   * spot rather than showing a move that isn't there.
   */
  function dropLabel(event: MouseEvent<HTMLDivElement>) {
    const locationId = movingId;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!locationId || !rect || rect.width === 0 || rect.height === 0) return;

    const x = toMapPercent(event.clientX - rect.left, rect.width);
    const y = toMapPercent(event.clientY - rect.top, rect.height);

    setMoved((current) => ({ ...current, [locationId]: { x, y } }));
    setMovingId(null);
    setSelectedId(null);
    setMoveFailed(false);

    startSaving(async () => {
      const result = await moveLocationOnMap(locationId, x, y);
      if (result.ok) return;
      setMoved((current) => {
        const rest = { ...current };
        delete rest[locationId];
        return rest;
      });
      setMoveFailed(true);
    });
  }

  // Escape backs out of a move — the usual way out of a mode, and the only one
  // that doesn't require finding the small Cancel button on a phone.
  useEffect(() => {
    if (!movingId) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMovingId(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movingId]);

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
              onClick={() => showDistrict(Math.max(0, districtIndex - 1))}
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
              onClick={() => showDistrict(Math.min(districts.length - 1, districtIndex + 1))}
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
                ref={frameRef}
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

                {/*
                  While a label is being moved this sheet takes every tap on the
                  frame — including taps that land on another label — so the
                  whole map is a drop target and nothing else can be picked up
                  mid-move. It only exists during a move, so the map stays
                  ordinarily clickable the rest of the time.
                */}
                {moving && (
                  <div
                    className="absolute inset-0 z-20 cursor-crosshair bg-black/20"
                    onClick={dropLabel}
                    role="presentation"
                  >
                    <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-col items-center gap-2">
                      <p className="rounded-full bg-black/80 px-4 py-1.5 text-center text-xs font-bold text-white shadow-lg">
                        {strings.moveHint(moving.name)}
                      </p>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setMovingId(null);
                        }}
                        className="pointer-events-auto rounded-full border border-white/30 bg-black/80 px-3 py-1 text-xs font-bold text-white/80 hover:bg-white/10"
                      >
                        {strings.moveCancel}
                      </button>
                    </div>
                  </div>
                )}
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
                  {canMoveLocations && (
                    <button
                      type="button"
                      onClick={() => {
                        setMovingId(selected.id);
                        setMoveFailed(false);
                      }}
                      aria-pressed={movingId === selected.id}
                      className={[
                        "shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors",
                        movingId === selected.id
                          ? "border-neon-pink bg-neon-pink/15 text-neon-pink"
                          : "border-white/25 text-white/70 hover:bg-white/10 hover:text-white",
                      ].join(" ")}
                    >
                      {strings.move}
                    </button>
                  )}
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
              // Two ways to end up without a stop: the district genuinely has
              // none, or a move just finished and deliberately left nothing
              // selected.
              <p className="text-small text-white/50">
                {locations.length === 0 ? strings.noLocations : strings.tapLocation}
              </p>
            )}

            {moveFailed && (
              <p role="alert" className="pt-2 text-small font-bold text-neon-pink">
                {strings.moveFailed}
              </p>
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
