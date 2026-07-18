"use client";

import { useState } from "react";

import MapBackground from "@/features/map/MapBackground";
import { MAP_ASPECT } from "@/features/map/mapConstants";
import MapLocationNode from "@/features/map/MapLocationNode";
import MascotMarker from "@/features/map/MascotMarker";
import { DEFAULT_MASCOT_IMAGE } from "@/features/wardrobe/mascot";

export interface AdminPreviewLocation {
  id: string;
  name: string;
  mapX: number;
  mapY: number;
  isPublished: boolean;
}

export interface AdminDistrictMapPreviewProps {
  districtName: string;
  backgroundUrl: string | null;
  locations: AdminPreviewLocation[];
}

/**
 * Collapsible player-eye preview of the district map for the admin: the same
 * frame, nodes, mascot marker and Start bar the player sees on `/map`, fed
 * with this district's data. Nodes are tappable so the admin can walk the
 * mascot around and check positions; the Start bar is display-only (admins
 * can't enter missions). Only published locations are shown, matching
 * exactly what players see on `/map`.
 */
export default function AdminDistrictMapPreview({
  districtName,
  backgroundUrl,
  locations,
}: AdminDistrictMapPreviewProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const publishedLocations = locations.filter((loc) => loc.isPublished);
  const selected =
    publishedLocations.find((loc) => loc.id === selectedId) ?? publishedLocations[0] ?? null;

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white/80 transition-colors hover:bg-white/10"
      >
        {open ? "✕ Close Map Preview" : "🗺 Preview Map"}
      </button>

      {open && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black">
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: String(MAP_ASPECT) }}>
            {backgroundUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={backgroundUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <MapBackground />
            )}

            <span
              className="absolute top-3 left-1/2 -translate-x-1/2 z-0 rounded-full bg-black/55 backdrop-blur px-4 py-1.5 text-sm font-extrabold uppercase tracking-[0.15em] text-white shadow-[0_0_14px_rgba(255,255,255,0.35)] pointer-events-none"
              aria-hidden="true"
            >
              {districtName}
            </span>

            {publishedLocations.map((loc) => (
              <MapLocationNode
                key={loc.id}
                name={loc.name}
                mapX={loc.mapX}
                mapY={loc.mapY}
                state="unlocked"
                selected={loc.id === selected?.id}
                onSelect={() => setSelectedId(loc.id)}
              />
            ))}

            {selected && (
              <MascotMarker
                mapX={selected.mapX}
                mapY={selected.mapY}
                imageUrl={DEFAULT_MASCOT_IMAGE}
              />
            )}
          </div>

          <div className="border-t border-white/10 p-4">
            {selected ? (
              <div
                aria-disabled="true"
                className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-lime-green/80 text-black font-extrabold uppercase tracking-wide"
              >
                <span className="truncate">▶ Start {selected.name}</span>
              </div>
            ) : (
              <p className="text-center text-small text-white/50">
                No published locations yet — publish one to see it on the map.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
