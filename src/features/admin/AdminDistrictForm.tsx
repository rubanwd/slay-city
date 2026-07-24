"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";
import { KNOWLEDGE_LEVELS, KNOWLEDGE_LEVEL_LABELS } from "@/features/levels/levels";
import type { KnowledgeLevel } from "@/types";

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

export interface AdminDistrictFormProps {
  /**
   * The level the new district lands in. Set when the form is opened from a
   * level page (the usual path), which hides the level picker — the level is
   * already implied by where the admin is. Left unset the form asks for it.
   */
  fixedLevel?: KnowledgeLevel;
}

/** "New District" form, opened from a level's Add District modal. */
export default function AdminDistrictForm({ fixedLevel }: AdminDistrictFormProps = {}) {
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
      {fixedLevel ? (
        <input type="hidden" name="level" value={fixedLevel} />
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Level</span>
          <select name="level" defaultValue="elementary" className={INPUT_CLASS}>
            {KNOWLEDGE_LEVELS.map((level) => (
              <option key={level} value={level} className="bg-[#1a1a1a]">
                {KNOWLEDGE_LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
        </label>
      )}
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
