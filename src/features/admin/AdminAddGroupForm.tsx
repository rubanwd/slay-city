"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import { useAdminModalControls } from "./AdminModal";
import { useAdminToast } from "./AdminToast";
import { createTeacherGroup, type AdminFormState } from "./actions";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

export interface AdminAddGroupFormProps {
  teacherId: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="md" loading={pending} className="flex-1">
      Create Group
    </SlayButton>
  );
}

export default function AdminAddGroupForm({ teacherId }: AdminAddGroupFormProps) {
  const [state, formAction] = useActionState<AdminFormState, FormData>(createTeacherGroup, {});
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
      <input type="hidden" name="teacher_id" value={teacherId} />
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Group name</span>
        <input
          name="name"
          type="text"
          required
          autoComplete="off"
          placeholder="e.g. Class 3B"
          className={INPUT_CLASS}
        />
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
