"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";
import type { Database } from "@/types/database";

import AdminTaskContentFields from "./AdminTaskContentFields";
import { useAdminModalControls } from "./AdminModal";
import { useAdminToast } from "./AdminToast";
import { createMissionTask, type AdminFormState } from "./actions";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

type MissionTaskType = Database["public"]["Enums"]["mission_task_type"];

const TASK_TYPES: MissionTaskType[] = ["vocabulary", "matching", "listening", "quiz"];

export interface AdminTaskFormProps {
  missionId: string;
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

export default function AdminTaskForm({ missionId, nextOrder }: AdminTaskFormProps) {
  const [state, formAction] = useActionState<AdminFormState, FormData>(createMissionTask, {});
  const [taskType, setTaskType] = useState<MissionTaskType>("vocabulary");
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
      <input type="hidden" name="mission_id" value={missionId} />

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
                {t[0].toUpperCase() + t.slice(1)}
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
