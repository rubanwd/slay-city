"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import type { AdminDistrictItemData } from "./AdminDistrictList";
import MapBackgroundField from "./MapBackgroundField";
import type { MapBackgroundLocation } from "./mapBackgroundPrompt";
import { useAdminToast } from "./AdminToast";
import { deleteDistrict, updateDistrict, type AdminFormState } from "./actions";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="sm" loading={pending}>
      Save
    </SlayButton>
  );
}

export interface AdminDistrictHeaderProps {
  district: AdminDistrictItemData;
  /** This district's locations, in map order — they shape the AI background prompt. */
  locations?: MapBackgroundLocation[];
}

/** Editable district card shown at the top of the district detail page. */
export default function AdminDistrictHeader({ district, locations }: AdminDistrictHeaderProps) {
  const [editing, setEditing] = useState(false);
  const toast = useAdminToast();

  // Wraps the server action so a successful save can collapse the card back to
  // its read-only view. The toast is what confirms the write, since the card
  // itself shows little of what changed.
  const [state, formAction] = useActionState<AdminFormState, FormData>(async (prev, formData) => {
    const result = await updateDistrict(prev, formData);
    if (result.success) {
      toast.success(result.success);
      setEditing(false);
    }
    return result;
  }, {});

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-[#1a1a1a] p-4">
      {editing ? (
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={district.id} />

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>District Name</span>
            <input name="name" defaultValue={district.name} className={INPUT_CLASS} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Description</span>
            <textarea
              name="description"
              rows={2}
              defaultValue={district.description ?? ""}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Order</span>
            <input
              name="order_index"
              type="number"
              min={0}
              defaultValue={district.order_index}
              className={INPUT_CLASS}
            />
          </label>
          <MapBackgroundField
            name="background_image_url"
            label="Map Background"
            defaultValue={district.background_image_url}
            locations={locations}
          />
          <label className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
            <span className="text-body-strong text-white">Published</span>
            <input
              name="is_published"
              type="checkbox"
              defaultChecked={district.is_published}
              className="h-5 w-5 shrink-0 accent-lime-green"
            />
          </label>

          {state.error && (
            <p role="alert" className="text-sm font-semibold text-neon-pink">
              {state.error}
            </p>
          )}

          <div className="flex items-center gap-2">
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
              <span className="truncate text-h3 font-bold text-white">{district.name}</span>
              <span
                className={[
                  "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                  district.is_published ? "bg-lime-green/20 text-lime-green" : "bg-cyan/20 text-cyan",
                ].join(" ")}
              >
                {district.is_published ? "Published" : "Draft"}
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
          {district.description && (
            <p className="text-small text-white/50">{district.description}</p>
          )}
        </div>
      )}

      {editing && (
        <form
          action={deleteDistrict}
          onSubmit={(e) => {
            if (
              !window.confirm(
                "Delete this district and ALL its locations, missions, and tasks? This cannot be undone."
              )
            ) {
              e.preventDefault();
            }
          }}
          className="mt-3 border-t border-white/10 pt-3"
        >
          <input type="hidden" name="id" value={district.id} />
          <button
            type="submit"
            className="rounded-full border border-neon-pink/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neon-pink transition-colors hover:bg-neon-pink/10"
          >
            Delete District
          </button>
        </form>
      )}
    </div>
  );
}
