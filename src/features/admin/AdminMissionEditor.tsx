"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import { createMission, type AdminFormState } from "./actions";

export interface LocationOption {
  id: string;
  /** Display label, e.g. "Downtown District • Central Café". */
  label: string;
}

export interface AdminMissionEditorProps {
  locations: LocationOption[];
}

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 caret-neon-pink " +
  "border border-white/20 transition-colors " +
  "focus:outline-none focus:bg-white/15 focus:border-neon-pink focus:ring-2 focus:ring-neon-pink/60";

const LABEL_CLASS = "text-label text-white/50 uppercase tracking-widest";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="lg" loading={pending} className="w-full">
      Create Mission
    </SlayButton>
  );
}

export default function AdminMissionEditor({ locations }: AdminMissionEditorProps) {
  const [state, formAction] = useActionState<AdminFormState, FormData>(createMission, {});

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Title</span>
        <input name="title" type="text" required placeholder="In the Kitchen" className={INPUT_CLASS} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Description</span>
        <textarea
          name="description"
          rows={3}
          placeholder="Optional — a short summary of the mission."
          className={INPUT_CLASS}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Location</span>
        {locations.length > 0 ? (
          <select name="location_id" required defaultValue="" className={INPUT_CLASS}>
            <option value="" disabled>
              Select a location…
            </option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.label}
              </option>
            ))}
          </select>
        ) : (
          <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-small text-amber-300">
            No locations exist yet. Create a district and location first.
          </p>
        )}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>XP Reward</span>
          <input
            name="xp_reward"
            type="number"
            min={0}
            defaultValue={0}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Coin Reward</span>
          <input
            name="coin_reward"
            type="number"
            min={0}
            defaultValue={0}
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
        <span className="flex flex-col">
          <span className="text-body-strong text-white">Published</span>
          <span className="text-small text-white/50">Visible to players on the map.</span>
        </span>
        <input
          name="is_published"
          type="checkbox"
          className="h-5 w-5 shrink-0 accent-lime-green"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm font-semibold text-neon-pink">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
