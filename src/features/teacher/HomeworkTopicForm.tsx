"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";
import { INPUT_CLASS, LABEL_CLASS } from "@/features/admin/formStyles";
import { useAdminModalControls } from "@/features/admin/AdminModal";
import { useAdminToast } from "@/features/admin/AdminToast";
import ImageUploadField from "@/features/admin/ImageUploadField";

import { createHomeworkTopic, type TeacherFormState } from "./actions";

export interface HomeworkTopicFormProps {
  groupId: string;
  /** Suggested order for the next topic (usually current topic count). */
  nextOrder: number;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="md" loading={pending} className="flex-1">
      Add Topic
    </SlayButton>
  );
}

/** Create form for a lesson topic — title, optional description, and optional note (text/link/image). */
export default function HomeworkTopicForm({ groupId, nextOrder }: HomeworkTopicFormProps) {
  const [state, formAction] = useActionState<TeacherFormState, FormData>(createHomeworkTopic, {});
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
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="order_index" value={nextOrder} />

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Topic Title</span>
        <input name="title" type="text" required autoFocus className={INPUT_CLASS} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Description (optional)</span>
        <textarea name="description" rows={3} className={INPUT_CLASS} />
      </label>

      <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-small text-white/50">
        A shared Q&amp;A thread opens on this topic once it&apos;s created — you and the group can
        ask questions and leave notes there.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Link (optional)</span>
        <input
          name="note_link_url"
          type="url"
          placeholder="https://..."
          className={INPUT_CLASS}
        />
      </label>

      <ImageUploadField name="note_image_url" label="Image (optional)" folder="homework" />

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
