"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import AdminLocationItem, { type AdminLocationItemData } from "./AdminLocationItem";
import type { AdminMissionItemData } from "./AdminMissionItem";
import { updateDistrict, type AdminFormState } from "./actions";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

export interface AdminDistrictItemData {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_published: boolean;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="sm" loading={pending}>
      Save
    </SlayButton>
  );
}

export interface AdminDistrictItemProps {
  district: AdminDistrictItemData;
  locations: AdminLocationItemData[];
  missionsByLocation: Record<string, AdminMissionItemData[]>;
}

export default function AdminDistrictItem({
  district,
  locations,
  missionsByLocation,
}: AdminDistrictItemProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState<AdminFormState, FormData>(updateDistrict, {});

  return (
    <li className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-4">
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

          <div className="flex gap-2">
            <SaveButton />
            <SlayButton type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </SlayButton>
          </div>
        </form>
      ) : (
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
      )}

      {locations.length === 0 ? (
        <p className="mt-3 rounded-lg bg-black/20 px-3 py-2 text-xs text-white/40">No locations yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {locations.map((loc) => (
            <AdminLocationItem key={loc.id} location={loc} missions={missionsByLocation[loc.id] ?? []} />
          ))}
        </ul>
      )}
    </li>
  );
}
