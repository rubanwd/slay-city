"use client";

import NavLink from "@/components/ui/NavLink";
import { useRouter } from "next/navigation";
import { useState, type DragEvent } from "react";

import type { KnowledgeLevel } from "@/types";

import { useAdminToast } from "./AdminToast";
import { reorderDistricts } from "./actions";

export interface AdminDistrictItemData {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_published: boolean;
  background_image_url: string | null;
  /** The knowledge level this district belongs to. */
  level: KnowledgeLevel;
}

export interface AdminDistrictListProps {
  districts: AdminDistrictItemData[];
  /** Location count per district id, shown on each row. */
  locationCounts: Record<string, number>;
}

/**
 * The districts list with drag-and-drop ordering. Drop a card in a new spot
 * and every district's `order_index` is rewritten to its list position (dense
 * 0, 1, 2, …) via {@link reorderDistricts} — the Order field in the edit forms
 * reflects it on the next load. The reorder is optimistic: the list moves
 * immediately and rolls back with a toast if the save fails.
 */
export default function AdminDistrictList({ districts, locationCounts }: AdminDistrictListProps) {
  const router = useRouter();
  const toast = useAdminToast();

  const [items, setItems] = useState(districts);
  const [saving, setSaving] = useState(false);
  // Index of the card being dragged / hovered over, for styling.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Server refetches (revalidatePath + refresh) replace the optimistic order —
  // state is adjusted during render, per the React "you might not need an
  // effect" pattern.
  const [prevDistricts, setPrevDistricts] = useState(districts);
  if (districts !== prevDistricts) {
    setPrevDistricts(districts);
    setItems(districts);
  }

  function handleDragStart(event: DragEvent<HTMLLIElement>, index: number) {
    setDragIndex(index);
    event.dataTransfer.effectAllowed = "move";
    // Firefox needs data set for the drag to start at all.
    event.dataTransfer.setData("text/plain", items[index].id);
  }

  function handleDragOver(event: DragEvent<HTMLLIElement>, index: number) {
    event.preventDefault(); // required to allow dropping
    event.dataTransfer.dropEffect = "move";
    if (index !== overIndex) setOverIndex(index);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  async function handleDrop(event: DragEvent<HTMLLIElement>, targetIndex: number) {
    event.preventDefault();
    const from = dragIndex;
    handleDragEnd();
    if (from === null || from === targetIndex) return;

    const previous = items;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    // Mirror what the server will write, so the UI is truthful immediately.
    setItems(next.map((d, i) => ({ ...d, order_index: i })));

    setSaving(true);
    const result = await reorderDistricts(next.map((d) => d.id));
    setSaving(false);

    if (result.error) {
      setItems(previous);
      toast.error(result.error);
      return;
    }
    toast.success(result.success ?? "District order saved.");
    router.refresh();
  }

  return (
    <>
      <ul className="mb-2 flex flex-col gap-3">
        {items.map((district, index) => (
          <li
            key={district.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={[
              "rounded-2xl transition-opacity",
              dragIndex === index ? "opacity-40" : "",
              overIndex === index && dragIndex !== null && dragIndex !== index
                ? "ring-2 ring-lime-green"
                : "",
            ].join(" ")}
          >
            <NavLink
              href={`/admin/districts/${district.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] p-4 transition-colors hover:border-white/30 hover:bg-white/5"
            >
              {/* Drag affordance + order number; the whole card is draggable. */}
              <span
                aria-hidden="true"
                className="flex shrink-0 cursor-grab flex-col items-center gap-1 text-white/40 active:cursor-grabbing"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="9" cy="5" r="1.7" />
                  <circle cx="15" cy="5" r="1.7" />
                  <circle cx="9" cy="12" r="1.7" />
                  <circle cx="15" cy="12" r="1.7" />
                  <circle cx="9" cy="19" r="1.7" />
                  <circle cx="15" cy="19" r="1.7" />
                </svg>
                <span className="text-[10px] font-black">{district.order_index}</span>
              </span>

              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-h3 font-bold text-white">{district.name}</span>
                  <span
                    className={[
                      "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                      district.is_published
                        ? "bg-lime-green/20 text-lime-green"
                        : "bg-cyan/20 text-cyan",
                    ].join(" ")}
                  >
                    {district.is_published ? "Published" : "Draft"}
                  </span>
                </span>
                {district.description && (
                  <span className="truncate text-small text-white/50">{district.description}</span>
                )}
                <span className="text-small text-white/50">
                  {locationCounts[district.id] ?? 0} location
                  {(locationCounts[district.id] ?? 0) === 1 ? "" : "s"}
                </span>
              </span>

              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="shrink-0 text-white/40"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </NavLink>
          </li>
        ))}
      </ul>

      <p className="mb-6 text-center text-xs text-white/30" aria-live="polite">
        {saving ? "Saving order…" : "Drag cards to change the district order."}
      </p>
    </>
  );
}
