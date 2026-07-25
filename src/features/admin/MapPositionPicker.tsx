"use client";

import { useRef, useState, type KeyboardEvent, type MouseEvent } from "react";

import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useImageLoaded } from "@/hooks/useImageLoaded";

import { MAP_ASPECT } from "../map/mapConstants";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

function clampPercent(n: number): number {
  return Math.min(100, Math.max(0, n));
}

/** Rounds to one decimal — plenty of precision for a map position. */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export interface MapPositionPickerProps {
  /** Form field names for the two coordinate inputs. */
  xName?: string;
  yName?: string;
  defaultX?: number;
  defaultY?: number;
  /** District background image — the same one the student sees on the map. */
  backgroundUrl?: string | null;
  /** Location icon, shown as the pin so it matches the student's map marker. */
  iconUrl?: string | null;
  /** Crop/preview aspect ratio (width / height). Defaults to the map ratio. */
  aspect?: number;
}

/**
 * Interactive map-position picker. Shows the district background at the map
 * ratio; tapping/clicking (or arrow keys when focused) drops the pin and fills
 * the Map X / Map Y fields. The preview mirrors the student's `/map` so admins
 * place stops exactly where players will see them.
 */
export default function MapPositionPicker({
  xName = "map_x",
  yName = "map_y",
  defaultX = 50,
  defaultY = 50,
  backgroundUrl,
  iconUrl,
  aspect = MAP_ASPECT,
}: MapPositionPickerProps) {
  const [pos, setPos] = useState({ x: clampPercent(defaultX), y: clampPercent(defaultY) });
  // Same treatment as the student's map: hold a loader over the frame until the
  // district background has decoded, so admins don't place a pin against a
  // blank preview and mis-position it.
  const bgLoaded = useImageLoaded(backgroundUrl);
  const previewRef = useRef<HTMLDivElement>(null);
  const xInputRef = useRef<HTMLInputElement>(null);
  const yInputRef = useRef<HTMLInputElement>(null);

  /** Move the pin and mirror the values into the (uncontrolled) number inputs. */
  function commit(x: number, y: number) {
    setPos({ x, y });
    if (xInputRef.current) xInputRef.current.value = String(x);
    if (yInputRef.current) yInputRef.current.value = String(y);
  }

  function placeAt(clientX: number, clientY: number) {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const x = clampPercent(round1(((clientX - rect.left) / rect.width) * 100));
    const y = clampPercent(round1(((clientY - rect.top) / rect.height) * 100));
    commit(x, y);
  }

  function handleClick(e: MouseEvent<HTMLDivElement>) {
    placeAt(e.clientX, e.clientY);
  }

  /** Arrow keys nudge the pin (Shift = larger step) once the preview is focused. */
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 5 : 1;
    let { x, y } = pos;
    switch (e.key) {
      case "ArrowLeft":
        x = clampPercent(round1(x - step));
        break;
      case "ArrowRight":
        x = clampPercent(round1(x + step));
        break;
      case "ArrowUp":
        y = clampPercent(round1(y - step));
        break;
      case "ArrowDown":
        y = clampPercent(round1(y + step));
        break;
      default:
        return;
    }
    e.preventDefault();
    commit(x, y);
  }

  /** Keeps the pin in sync when X/Y are typed directly. */
  function handleCoordChange() {
    const x = Number(xInputRef.current?.value);
    const y = Number(yInputRef.current?.value);
    setPos({
      x: Number.isFinite(x) ? clampPercent(x) : defaultX,
      y: Number.isFinite(y) ? clampPercent(y) : defaultY,
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className={LABEL_CLASS}>Map Position</span>
      <p className="text-xs text-white/40">
        Tap the map to drop the pin (or use arrow keys / the fields below). This is exactly
        where the location appears on the student&apos;s map.
      </p>

      <div
        ref={previewRef}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Map position picker — tap to place the pin"
        className="relative w-full cursor-crosshair overflow-hidden rounded-xl border border-white/15 bg-gradient-to-br from-purple/25 via-black to-cyan/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink"
        style={{ aspectRatio: String(aspect) }}
      >
        {backgroundUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={backgroundUrl}
            alt=""
            aria-hidden="true"
            className={[
              "pointer-events-none absolute inset-0 h-full w-full object-cover",
              "transition-opacity duration-500",
              bgLoaded ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />
        )}

        <span
          aria-hidden="true"
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top]"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        >
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconUrl}
              alt=""
              className="h-9 w-9 rounded-full border-2 border-black object-cover shadow-[0_0_10px_2px_rgba(255,45,142,0.7)]"
            />
          ) : (
            <span className="block h-4 w-4 rounded-full border-2 border-black bg-neon-pink shadow-[0_0_10px_2px_rgba(255,45,142,0.7)]" />
          )}
        </span>

        {backgroundUrl && !bgLoaded && <FullScreenLoader fullScreen={false} mascot={false} />}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-white/50">X (0–100)</span>
          <input
            ref={xInputRef}
            name={xName}
            type="number"
            min={0}
            max={100}
            step={0.1}
            defaultValue={pos.x}
            onChange={handleCoordChange}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-white/50">Y (0–100)</span>
          <input
            ref={yInputRef}
            name={yName}
            type="number"
            min={0}
            max={100}
            step={0.1}
            defaultValue={pos.y}
            onChange={handleCoordChange}
            className={INPUT_CLASS}
          />
        </label>
      </div>
    </div>
  );
}
