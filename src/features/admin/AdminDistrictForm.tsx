"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import MapBackgroundField from "./MapBackgroundField";
import { useAdminModalControls } from "./AdminModal";
import { useAdminToast } from "./AdminToast";
import { createDistrict, type AdminFormState } from "./actions";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="md" loading={pending} className="flex-1">
      Create District
    </SlayButton>
  );
}

/** "New District" form, opened from the districts list's Add District modal. */
export default function AdminDistrictForm() {
  const [state, formAction] = useActionState<AdminFormState, FormData>(createDistrict, {});
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
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>District Name</span>
        <input name="name" type="text" required placeholder="Downtown" className={INPUT_CLASS} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Description</span>
        <textarea name="description" rows={2} placeholder="Optional" className={INPUT_CLASS} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Order</span>
        <input name="order_index" type="number" min={0} defaultValue={0} className={INPUT_CLASS} />
      </label>
      {/* A brand-new district has no locations yet — the prompt falls back to
          its name, description, and the admin's own notes. */}
      <MapBackgroundField name="background_image_url" label="Map Background" />
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
