"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import { useAdminModalControls } from "./AdminModal";
import { useAdminToast } from "./AdminToast";
import { createMission, type AdminFormState } from "./actions";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="md" loading={pending} className="flex-1">
      Create Mission
    </SlayButton>
  );
}

/** "New Mission" form, opened from a location detail page's Add Mission modal — location is pre-set. */
export default function AdminMissionForm({
  locationId,
  nextOrder,
}: {
  locationId: string;
  nextOrder: number;
}) {
  const [state, formAction] = useActionState<AdminFormState, FormData>(createMission, {});
  const modal = useAdminModalControls();
  const toast = useAdminToast();

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error, toast]);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      modal?.close();
    }
  }, [state.success, toast, modal]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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

      <div className="flex gap-2">
        <SubmitButton />
        {modal && (
          <SlayButton type="button" variant="ghost" size="md" onClick={() => modal.close()}>
            Cancel
          </SlayButton>
        )}
      </div>
    </form>
  );
}
