"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import { useAdminModalControls } from "./AdminModal";
import { useAdminToast } from "./AdminToast";
import { promoteTeacher, type AdminFormState } from "./actions";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="md" loading={pending} className="flex-1">
      Add Teacher
    </SlayButton>
  );
}

export default function AdminAddTeacherForm() {
  const [state, formAction] = useActionState<AdminFormState, FormData>(promoteTeacher, {});
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
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Email or username</span>
        <input
          name="identifier"
          type="text"
          required
          autoComplete="off"
          placeholder="person@example.com or username"
          className={INPUT_CLASS}
        />
      </label>
      <p className="text-xs text-white/40">
        Promotes an existing account to Teacher. It won&apos;t create a new account.
      </p>

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
