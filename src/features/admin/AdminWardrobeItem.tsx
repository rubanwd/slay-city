"use client";

import { useState } from "react";

import { wardrobeCategoryEmoji, wardrobeCategoryLabel } from "@/features/wardrobe/categories";

import AdminWardrobeForm, { type WardrobeItemFormData } from "./AdminWardrobeForm";
import { deleteWardrobeItem, publishWardrobeItem, unpublishWardrobeItem } from "./actions";

export type AdminWardrobeItemData = WardrobeItemFormData;

export interface AdminWardrobeItemProps {
  item: AdminWardrobeItemData;
}

/** A wardrobe catalog row — thumbnail, meta, and edit / publish / delete controls. */
export default function AdminWardrobeItem({ item }: AdminWardrobeItemProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-4">
        <AdminWardrobeForm
          mode="edit"
          item={item}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/5">
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl" aria-hidden="true">
              {wardrobeCategoryEmoji(item.item_type)}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-body-strong text-white">{item.name}</span>
            <span
              className={[
                "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                item.is_published ? "bg-lime-green/20 text-lime-green" : "bg-cyan/20 text-cyan",
              ].join(" ")}
            >
              {item.is_published ? "Published" : "Draft"}
            </span>
          </span>
          <span className="text-small text-white/50">
            {wardrobeCategoryLabel(item.item_type)} · ✦ {item.cost_coins}
            {item.unlock_level !== null ? ` · 🔒 Lvl ${item.unlock_level}` : ""}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/60 transition-colors hover:bg-white/10"
        >
          Edit
        </button>
        <form action={item.is_published ? unpublishWardrobeItem : publishWardrobeItem}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            className={[
              "w-full rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
              item.is_published
                ? "border-white/20 text-white/60 hover:bg-white/10"
                : "border-lime-green/50 text-lime-green hover:bg-lime-green/10",
            ].join(" ")}
          >
            {item.is_published ? "Unpublish" : "Publish"}
          </button>
        </form>
        <form
          action={deleteWardrobeItem}
          onSubmit={(e) => {
            if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            className="w-full rounded-full border border-neon-pink/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neon-pink transition-colors hover:bg-neon-pink/10"
          >
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}
