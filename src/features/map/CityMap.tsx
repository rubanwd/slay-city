"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { BottomNav, BOTTOM_NAV_CLEARANCE, type NavIconName } from "@/components/layout";
import { CoinAmount, XpAmount } from "@/components/ui";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useImageLoaded } from "@/hooks/useImageLoaded";
import { restartMyLevel } from "@/features/levels/actions";
import { resetLocationProgress } from "@/features/mission/actions";
import { playMapTravelSfx, playMissionStartSfx } from "@/lib/sfx";

import MapBackground from "./MapBackground";
import { MAP_ASPECT } from "./mapConstants";
import {
  defaultSelectedLocation,
  isDistrictCompleted,
  MAX_VISIBLE_LOCATIONS,
  selectVisibleLocations,
} from "./mapState";
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

function ReplayLevelButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={[
        "mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-lime-green px-4 py-3",
        "text-sm font-extrabold uppercase tracking-wide text-lime-green",
        "hover:bg-lime-green/10 active:bg-lime-green/5 disabled:opacity-50 transition-colors",
      ].join(" ")}
    >
      {pending ? "Resetting…" : "↻ Play this level again"}
    </button>
  );
}

/** What to say when the player has finished every district in their level. */
export interface LevelStatus {
  /** True once every district of the player's level is cleared. */
  completed: boolean;
  /** Display name of the level they just finished, e.g. "Elementary". */
  levelName: string;
  /** The level above it, or null at the top of the ladder. */
  nextLevelName: string | null;
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
  /** Shows the bottom nav's Homework tab — true when the student is in a teacher group. */
  showHomework?: boolean;
  /** Tab labels in the student's chosen language — see `studentNavLabels`. */
  navLabels?: Partial<Record<NavIconName, string>>;
  /**
   * Set when the player has cleared their whole level. Reaching the map in
   * this state means no next level had content — the server moves them up
   * automatically as soon as one does.
   */
  levelStatus?: LevelStatus | null;
}

export default function CityMap({
  district,
  hud,
  mascotImageUrl,
  showHomework,
  navLabels,
  levelStatus,
}: CityMapProps) {
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

  // "Nothing left to play here" — drives the reward line and the restart
  // button. A stop that still has a mission always shows Start, even if some of
  // its missions are already done.
  const isCompleted = Boolean(selected && !selected.missionId && selected.state === "completed");

  // The reward screen lands the player here with ?focus=<locationId> and, on
  // a location/district clear, &milestone=location|district — so the map can
  // walk the mascot straight to what was just finished and explain what
  // changed, instead of the player wondering why they're back here. Read via
  // window.location (not useSearchParams) so this stays a plain client effect
  // with no Suspense boundary required.
  const [milestoneBanner, setMilestoneBanner] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const focus = params.get("focus");
    const milestone = params.get("milestone");
    const name = params.get("name");

    // eslint-disable-next-line react-hooks/set-state-in-effect -- deferred to the client on purpose: the URL is only meaningful post-hydration, so setting it during render would mismatch SSR
    if (focus) setSelectedId(focus);

    if (milestone === "level") {
      setMilestoneBanner(
        name ? `🏆 Level cleared! Welcome to ${name}.` : "🏆 Level cleared! Amazing work."
      );
    } else if (milestone === "district") {
      setMilestoneBanner(`🏙️ District cleared! Welcome to ${district?.name ?? "the next district"}.`);
    } else if (milestone === "location") {
      setMilestoneBanner(`✓ ${name ?? "Location"} complete!`);
    }

    if (focus || milestone) {
      window.history.replaceState(null, "", "/map");
    }
    // Only ever read the URL the map was opened with, once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!milestoneBanner) return;
    const timer = window.setTimeout(() => setMilestoneBanner(null), 4500);
    return () => window.clearTimeout(timer);
  }, [milestoneBanner]);

  const activeBackgroundUrl = district?.backgroundUrl ?? null;

  // Hold a loader over the map area until the (large, remote) district
  // background has decoded, so the player never sees a blank or half-painted
  // frame on first open.
  const bgLoaded = useImageLoaded(activeBackgroundUrl);

  return (
    <main className="relative h-dvh bg-black flex flex-col overflow-hidden mx-auto w-full max-w-md md:border-x md:border-white/10">
      <header className="flex items-center justify-between gap-2 px-5 py-3 border-b border-white/10 shrink-0">
        <h1 className="text-lg font-black text-lime-green leading-tight uppercase">Slay City</h1>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 text-sm font-bold text-white whitespace-nowrap">
            Lvl {hud.level} · {hud.xp} XP
          </span>
          <CoinAmount
            value={hud.coins}
            label={`${hud.coins} coins`}
            className="px-3 py-1.5 rounded-full bg-white/10 text-sm text-yellow-300"
          />
        </div>
      </header>

      {milestoneBanner && (
        <div role="status" className="absolute inset-x-4 top-16 z-20 flex justify-center">
          <p className="animate-banner-drop rounded-full border-2 border-lime-green bg-black/85 px-4 py-2 text-center text-sm font-extrabold text-lime-green shadow-[0_0_16px_rgba(157,255,0,0.45)]">
            {milestoneBanner}
          </p>
        </div>
      )}

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
                className="absolute top-3 left-1/2 -translate-x-1/2 z-0 whitespace-nowrap text-center rounded-full bg-black/55 backdrop-blur px-4 py-1.5 text-sm font-extrabold uppercase tracking-[0.15em] text-white shadow-[0_0_14px_rgba(255,255,255,0.35)] pointer-events-none"
                aria-hidden="true"
              >
                {district.name}
                {/* Every location here is done — the whole game is finished
                    (there's no further district to advance to). */}
                {isDistrictCompleted(district) && (
                  <span className="ml-1.5 text-lime-green">✓ cleared</span>
                )}
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
                onSelect={() => {
                  // Only worth a sound when the mascot actually walks somewhere new.
                  if (loc.id !== selectedId) void playMapTravelSfx();
                  setSelectedId(loc.id);
                }}
              />
            ))}

            {selected && (
              <MascotMarker mapX={selected.mapX} mapY={selected.mapY} imageUrl={mascotImageUrl} />
            )}
          </div>
        </div>

        {activeBackgroundUrl && !bgLoaded && (
          <FullScreenLoader
            fullScreen={false}
            label="Loading map…"
            mascotImageUrl={mascotImageUrl}
          />
        )}
      </div>

      {/*
        End of the level. The server promotes the player the moment a higher
        level has content, so seeing this means there is nothing above them
        yet — offer the replay instead of leaving them on a map where every
        stop reads "Completed".
      */}
      {levelStatus?.completed && (
        <div className="shrink-0 border-t border-white/10 px-5 pt-4">
          <div className="rounded-2xl border-2 border-lime-green bg-lime-green/10 px-4 py-3">
            <p className="text-base font-black uppercase tracking-wide text-lime-green">
              🏆 {levelStatus.levelName} cleared!
            </p>
            <p className="text-sm text-white/70">
              {levelStatus.nextLevelName
                ? `You finished every district here. ${levelStatus.nextLevelName} is coming soon — it opens automatically as soon as it has content.`
                : "You finished every district in the city. That's the whole ladder!"}
            </p>

            <form
              action={async () => {
                const result = await restartMyLevel();
                if (!result.ok) window.alert(result.error);
              }}
              onSubmit={(event) => {
                if (
                  !window.confirm(
                    `Replay ${levelStatus.levelName}? Every mission in this level starts over — your XP and coins stay.`
                  )
                ) {
                  event.preventDefault();
                }
              }}
            >
              <ReplayLevelButton />
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className={`px-5 pt-4 ${BOTTOM_NAV_CLEARANCE} border-t border-white/10 shrink-0`}>
          {/*
            Always-visible name + "done so far" count for the selected stop,
            so the player never has to guess how many missions are left here —
            not just once it's fully cleared.
          */}
          <div className="flex items-center justify-between gap-2 pb-2">
            <h2 className="min-w-0 truncate text-base font-black text-white">{selected.name}</h2>
            {selected.totalMissions > 0 && (
              <span
                className={[
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap",
                  isCompleted ? "bg-lime-green/15 text-lime-green" : "bg-white/10 text-white/70",
                ].join(" ")}
              >
                {selected.missionsCompleted}/{selected.totalMissions} missions
              </span>
            )}
          </div>

          {/*
            The reward line and the restart button exist only for completed
            stops, so tapping between stops used to snap this panel — and with
            it the flex-1 map above — to a new height. Both are always mounted
            now and collapse instead: grid-template-rows 0fr→1fr for the line,
            width for the button. The map resizes along with the animation for
            free, since it just takes the leftover flex space each frame.
          */}
          <div
            className={[
              "grid transition-all duration-300 ease-out motion-reduce:transition-none",
              isCompleted ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            ].join(" ")}
            aria-hidden={!isCompleted}
          >
            <div className="overflow-hidden">
              <p className="flex items-center justify-center gap-2 pb-2 text-center text-sm font-bold text-white/60">
                <CoinAmount value={`+${selected.totalCoins}`} className="text-yellow-300" />
                <span aria-hidden="true">·</span>
                <XpAmount value={`+${selected.totalXp}`} />
                <span>earned</span>
              </p>
            </div>
          </div>

          <div className="flex items-center">
            {selected.missionId ? (
              <Link
                href={`/mission/${selected.missionId}`}
                onClick={() => {
                  void playMissionStartSfx();
                }}
                className={[
                  "flex flex-1 min-w-0 items-center justify-center gap-2 h-14 rounded-2xl",
                  "bg-lime-green text-black font-extrabold uppercase tracking-wide text-lg",
                  "hover:brightness-110 active:brightness-90 transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-green focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                ].join(" ")}
              >
                <span className="truncate">▶ Start</span>
              </Link>
            ) : (
              <div
                className="flex flex-1 min-w-0 items-center justify-center gap-2 h-14 rounded-2xl border-2 border-lime-green/40 text-lime-green/70 font-extrabold uppercase tracking-wide text-lg"
                aria-disabled="true"
              >
                <span className="truncate">
                  {isCompleted ? "✓ Completed" : "Coming soon"}
                </span>
              </div>
            )}

            <div
              className={[
                "shrink-0 overflow-hidden transition-all duration-300 ease-out motion-reduce:transition-none",
                isCompleted ? "w-14 ml-2 opacity-100" : "w-0 ml-0 opacity-0",
              ].join(" ")}
              inert={!isCompleted}
            >
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
        </div>
      )}

      <BottomNav showHomework={showHomework} labels={navLabels} />
    </main>
  );
}
