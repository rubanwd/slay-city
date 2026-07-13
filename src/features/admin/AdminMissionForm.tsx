"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import { createMission, type AdminFormState } from "./actions";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="md" loading={pending} className="w-full">
      Create Mission
    </SlayButton>
  );
}

/** Always-visible "New Mission" form on a location detail page — location is pre-set. */
export default function AdminMissionForm({
  locationId,
  nextOrder,
}: {
  locationId: string;
  nextOrder: number;
}) {
  const [state, formAction] = useActionState<AdminFormState, FormData>(createMission, {});
  const [formKey, setFormKey] = useState(0);

  // On a successful create, reset the form so another mission can be added fresh.
  const [lastSuccess, setLastSuccess] = useState(state.success);
  if (state.success !== lastSuccess) {
    setLastSuccess(state.success);
    if (state.success) setFormKey((k) => k + 1);
  }

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="location_id" value={locationId} />
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Title</span>
        <input name="title" required placeholder="In the Kitchen" className={INPUT_CLASS} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Description</span>
        <textarea name="description" rows={2} placeholder="Optional" className={INPUT_CLASS} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Order</span>
        <input name="order_index" type="number" min={0} defaultValue={nextOrder} className={INPUT_CLASS} />
        <span className="text-xs text-white/40">Missions at this location play in this order.</span>
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

      <SubmitButton />
    </form>
  );
}
