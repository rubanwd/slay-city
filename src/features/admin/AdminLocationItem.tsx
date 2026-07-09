"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import AdminMissionItem, { type AdminMissionItemData } from "./AdminMissionItem";
import { createMission, updateLocation, type AdminFormState } from "./actions";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

export interface AdminLocationItemData {
  id: string;
  district_id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_published: boolean;
  map_x: number | null;
  map_y: number | null;
}

function SaveButton({ label = "Save" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="sm" loading={pending}>
      {label}
    </SlayButton>
  );
}

function AddMissionForm({ locationId }: { locationId: string }) {
  const [state, formAction] = useActionState<AdminFormState, FormData>(createMission, {});
  const [formKey, setFormKey] = useState(0);

  // On a successful create, reset the form so another mission can be added fresh.
  const [lastSuccess, setLastSuccess] = useState(state.success);
  if (state.success !== lastSuccess) {
    setLastSuccess(state.success);
    if (state.success) setFormKey((k) => k + 1);
  }

  return (
    <form
      key={formKey}
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-3"
    >
      <input type="hidden" name="location_id" value={locationId} />
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Title</span>
        <input name="title" required placeholder="In the Kitchen" className={INPUT_CLASS} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Description</span>
        <textarea name="description" rows={2} placeholder="Optional" className={INPUT_CLASS} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>XP Reward</span>
          <input name="xp_reward" type="number" min={0} defaultValue={0} className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Coin Reward</span>
          <input name="coin_reward" type="number" min={0} defaultValue={0} className={INPUT_CLASS} />
        </label>
      </div>
      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
        <span className="text-body-strong text-white">Published</span>
        <input name="is_published" type="checkbox" className="h-5 w-5 shrink-0 accent-lime-green" />
      </label>

      {state.error && (
        <p role="alert" className="text-sm font-semibold text-neon-pink">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm font-semibold text-lime-green">
          {state.success}
        </p>
      )}

      <SaveButton label="Create Mission" />
    </form>
  );
}

export interface AdminLocationItemProps {
  location: AdminLocationItemData;
  missions: AdminMissionItemData[];
}

export default function AdminLocationItem({ location, missions }: AdminLocationItemProps) {
  const [editing, setEditing] = useState(false);
  const [addingMission, setAddingMission] = useState(false);
  const [state, formAction] = useActionState<AdminFormState, FormData>(updateLocation, {});

  return (
    <li className="rounded-xl border border-white/10 bg-white/5 p-3">
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
          <div className="grid grid-cols-3 gap-3">
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
            <label className="flex flex-col gap-1.5">
              <span className={LABEL_CLASS}>Map X</span>
              <input
                name="map_x"
                type="number"
                min={0}
                max={100}
                step={0.1}
                defaultValue={location.map_x ?? 50}
                className={INPUT_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL_CLASS}>Map Y</span>
              <input
                name="map_y"
                type="number"
                min={0}
                max={100}
                step={0.1}
                defaultValue={location.map_y ?? 50}
                className={INPUT_CLASS}
              />
            </label>
          </div>
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
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-body-strong text-white">{location.name}</span>
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
          {location.description && <p className="mt-1 text-small text-white/50">{location.description}</p>}
        </>
      )}

      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={LABEL_CLASS}>Missions ({missions.length})</span>
          <button
            type="button"
            onClick={() => setAddingMission((v) => !v)}
            className="text-xs font-bold uppercase tracking-wide text-lime-green hover:underline"
          >
            {addingMission ? "Cancel" : "+ Add Mission"}
          </button>
        </div>

        {addingMission && <AddMissionForm locationId={location.id} />}

        {missions.length === 0 ? (
          <p className="rounded-lg bg-black/20 px-3 py-2 text-xs text-white/40">No missions yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {missions.map((m) => (
              <AdminMissionItem key={m.id} mission={m} />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
