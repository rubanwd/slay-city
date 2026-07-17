"use client";

export interface MascotMarkerProps {
  /** Horizontal position, as a percentage of the map area's width. */
  mapX: number;
  /** Vertical position, as a percentage of the map area's height. */
  mapY: number;
  imageUrl: string;
}

/**
 * You-are-here mascot: floats above the selected map node and glides
 * (left/top transition) when the position changes. Bob + shadow reuse the
 * loader's animation pair so the snake hops the same way everywhere.
 */
export default function MascotMarker({ mapX, mapY, imageUrl }: MascotMarkerProps) {
  return (
    <div
      aria-hidden="true"
      className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-[calc(100%+1.25rem)] transition-[left,top] duration-700 ease-in-out"
      style={{ left: `${mapX}%`, top: `${mapY}%` }}
    >
      <div className="flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="h-[clamp(3.5rem,12vmin,5.5rem)] w-[clamp(3.5rem,12vmin,5.5rem)] object-contain drop-shadow-[0_0_20px_rgba(157,255,0,0.45)] animate-loader-bob"
        />
        <span className="mt-1 h-2 w-12 rounded-full bg-lime-green/40 blur-[3px] animate-loader-shadow" />
      </div>
    </div>
  );
}
