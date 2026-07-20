"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";
import AdminTaskContentFields from "@/features/admin/AdminTaskContentFields";
import { useAdminModalControls } from "@/features/admin/AdminModal";
import { useAdminToast } from "@/features/admin/AdminToast";
import { INPUT_CLASS, LABEL_CLASS } from "@/features/admin/formStyles";
import { TASK_TYPES, taskTypeLabel, type MissionTaskType } from "@/features/admin/taskTypes";

import { createHomeworkTask, type TeacherFormState } from "./actions";

export interface HomeworkTaskFormProps {
  topicId: string;
  groupId: string;
  /** Suggested order for the next task (usually current task count). */
  nextOrder: number;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="md" loading={pending} className="flex-1">
      Add Task
    </SlayButton>
  );
}

/**
 * Create form for a homework task — reuses the exact same task-type catalog
 * and guided content editors as the admin mission-task form
 * (`AdminTaskForm`), just wired to `createHomeworkTask` and scoped to a
 * homework topic instead of a mission. Homework tasks have no publish state:
 * a teacher's own group sees them the moment they're added.
 */
export default function HomeworkTaskForm({ topicId, groupId, nextOrder }: HomeworkTaskFormProps) {
  const [state, formAction] = useActionState<TeacherFormState, FormData>(createHomeworkTask, {});
  const [taskType, setTaskType] = useState<MissionTaskType>(TASK_TYPES[0]);
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
      <input type="hidden" name="topic_id" value={topicId} />
      <input type="hidden" name="group_id" value={groupId} />

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Task Type</span>
          <select
            name="task_type"
            required
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as MissionTaskType)}
            className={`${INPUT_CLASS} [&>option]:bg-[#1a1a1a] [&>option]:text-white`}
          >
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>
                {taskTypeLabel(t)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Order</span>
          <input
            name="order_index"
            type="number"
            min={0}
            defaultValue={nextOrder}
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <AdminTaskContentFields key={taskType} taskType={taskType} />

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
