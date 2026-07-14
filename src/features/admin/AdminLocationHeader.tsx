"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import type { AdminLocationItemData } from "./AdminLocationItem";
import ImageUploadField from "./ImageUploadField";
import MapPositionPicker from "./MapPositionPicker";
import { deleteLocation, updateLocation, type AdminFormState } from "./actions";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="sm" loading={pending}>
      Save
    </SlayButton>
  );
}

export interface AdminLocationHeaderProps {
  location: AdminLocationItemData;
  /** The district's background, shown in the position picker to match the child's map. */
  districtBackgroundUrl?: string | null;
}

/** Editable location card shown at the top of the location detail page. */
export default function AdminLocationHeader({
  location,
  districtBackgroundUrl,
}: AdminLocationHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState<AdminFormState, FormData>(updateLocation, {});

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-[#1a1a1a] p-4">
      {editing ? (
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={location.id} />
          <input type="hidden" name="district_id" value={location.district_id} />

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Location Name</span>
            <input name="name" defaultValue={location.name} className={INPUT_CLASS} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Description</span>
            <textarea
              name="description"
              rows={2}
              defaultValue={location.description ?? ""}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Order</span>
            <input
              name="order_index"
              type="number"
              min={0}
              defaultValue={location.order_index}
              className={INPUT_CLASS}
            />
          </label>
          <MapPositionPicker
            defaultX={location.map_x ?? 50}
            defaultY={location.map_y ?? 50}
            backgroundUrl={districtBackgroundUrl}
            iconUrl={location.icon_url}
          />
          <ImageUploadField
            name="icon_url"
            label="Map Icon"
            folder="locations"
            defaultValue={location.icon_url}
          />
          <label className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
            <span className="text-body-strong text-white">Published</span>
            <input
              name="is_published"
              type="checkbox"
              defaultChecked={location.is_published}
              className="h-5 w-5 shrink-0 accent-lime-green"
            />
          </label>

          {state.error && (
            <p role="alert" className="text-sm font-semibold text-neon-pink">
              {state.error}
            </p>
          )}

          <div className="flex gap-2">
            <SaveButton />
            <SlayButton type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </SlayButton>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-h3 font-bold text-white">{location.name}</span>
              <span
                className={[
                  "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                  location.is_published ? "bg-lime-green/20 text-lime-green" : "bg-cyan/20 text-cyan",
                ].join(" ")}
              >
                {location.is_published ? "Published" : "Draft"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/60 transition-colors hover:bg-white/10"
            >
              Edit
            </button>
          </div>
          {location.description && (
            <p className="text-small text-white/50">{location.description}</p>
          )}
          <p className="text-xs text-white/40">
            Map: {location.map_x ?? "—"}, {location.map_y ?? "—"}
          </p>
        </div>
      )}

      {editing && (
        <form
          action={deleteLocation}
          onSubmit={(e) => {
            if (
              !window.confirm(
                "Delete this location and ALL its missions and tasks? This cannot be undone."
              )
            ) {
              e.preventDefault();
            }
          }}
          className="mt-3 border-t border-white/10 pt-3"
        >
          <input type="hidden" name="id" value={location.id} />
          <input type="hidden" name="district_id" value={location.district_id} />
          <button
            type="submit"
            className="rounded-full border border-neon-pink/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neon-pink transition-colors hover:bg-neon-pink/10"
          >
            Delete Location
          </button>
        </form>
      )}
    </div>
  );
}
