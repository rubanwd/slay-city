"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";
import TaskRunner from "@/features/mission/TaskRunner";
import type { Json } from "@/types/database";

import AdminModal from "./AdminModal";
import AdminTaskContentFields from "./AdminTaskContentFields";
import { useAdminToast } from "./AdminToast";
import { updateTaskTypeTemplate, type AdminFormState } from "./actions";
import { taskTypeLabel, type MissionTaskType } from "./taskTypes";

export interface AdminTaskTypeConfiguratorProps {
  taskType: MissionTaskType;
  /** The template's current example content. */
  initialContent: Json;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="md" loading={pending} className="flex-1">
      Save
    </SlayButton>
  );
}

/**
 * The task-type detail editor: guided (or raw-JSON) fields for the type's example
 * content, a Save action that upserts the template, and a Test button that runs
 * the task with whatever is currently in the form — the same gameplay a child
 * would see in a real mission.
 */
export default function AdminTaskTypeConfigurator({
  taskType,
  initialContent,
}: AdminTaskTypeConfiguratorProps) {
  const [state, formAction] = useActionState<AdminFormState, FormData>(updateTaskTypeTemplate, {});
  const [content, setContent] = useState<Json | null>(initialContent);
  // A fresh key each time Test is pressed remounts TaskRunner for a clean run.
  // `null` means the modal is closed.
  const [testKey, setTestKey] = useState<number | null>(null);
  const toast = useAdminToast();

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error, toast]);

  useEffect(() => {
    if (state.success) toast.success(state.success);
  }, [state.success, toast]);

  const canTest = content !== null;

  return (
    <>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="task_type" value={taskType} />

        <AdminTaskContentFields
          taskType={taskType}
          initialContent={initialContent}
          onContentChange={setContent}
        />

        <div className="flex gap-2">
          <SaveButton />
          <SlayButton
            type="button"
            variant="pink"
            size="md"
            className="flex-1"
            disabled={!canTest}
            onClick={() => setTestKey(Date.now())}
          >
            Test task
          </SlayButton>
        </div>
        {!canTest && (
          <p className="text-xs text-neon-pink">
            Fix the JSON above before testing this task.
          </p>
        )}
      </form>

      <AdminModal
        open={testKey !== null}
        onClose={() => setTestKey(null)}
        title={`Test — ${taskTypeLabel(taskType)}`}
      >
        <div className="flex flex-col gap-3">
          <TaskRunner
            key={testKey ?? 0}
            taskType={taskType}
            content={content ?? {}}
            onComplete={() => setTestKey(null)}
            actionLabel="Done"
          />
          <div className="flex gap-2">
            <SlayButton
              type="button"
              variant="ghost"
              size="md"
              className="flex-1"
              onClick={() => setTestKey(null)}
            >
              Exit to admin
            </SlayButton>
            <SlayButton type="button" variant="green" size="md" onClick={() => setTestKey(Date.now())}>
              Restart
            </SlayButton>
          </div>
        </div>
      </AdminModal>
    </>
  );
}
