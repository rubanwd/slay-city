"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";
import AdminTaskContentFields from "@/features/admin/AdminTaskContentFields";
import { INPUT_CLASS, LABEL_CLASS } from "@/features/admin/formStyles";
import { TASK_TYPES, taskTypeLabel, type MissionTaskType } from "@/features/admin/taskTypes";
import type { Json } from "@/types/database";

import { deleteHomeworkTask, updateHomeworkTask, type TeacherFormState } from "./actions";

export interface HomeworkTaskItemProps {
  topicId: string;
  groupId: string;
  task: {
    id: string;
    task_type: MissionTaskType;
    order_index: number;
    content: Json;
  };
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="sm" loading={pending}>
      Save
    </SlayButton>
  );
}

/** One homework task row: edit (inline, same guided content editors as admin) or delete. */
export default function HomeworkTaskItem({ topicId, groupId, task }: HomeworkTaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [editTaskType, setEditTaskType] = useState<MissionTaskType>(task.task_type);
  const [state, formAction] = useActionState<TeacherFormState, FormData>(updateHomeworkTask, {});

  if (editing) {
    return (
      <li className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3">
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="topic_id" value={topicId} />
          <input type="hidden" name="group_id" value={groupId} />

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL_CLASS}>Task Type</span>
              <select
                name="task_type"
                required
                value={editTaskType}
                onChange={(e) => setEditTaskType(e.target.value as MissionTaskType)}
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
                defaultValue={task.order_index}
                className={INPUT_CLASS}
              />
            </label>
          </div>

          <AdminTaskContentFields
            key={editTaskType}
            taskType={editTaskType}
            initialContent={editTaskType === task.task_type ? task.content : undefined}
          />

          {state.error && (
            <p role="alert" className="text-sm font-semibold text-neon-pink">
              {state.error}
            </p>
          )}

          <div className="flex gap-2">
            <SaveButton />
            <SlayButton type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </SlayButton>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-4">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white/70">
          {task.order_index}
        </span>
        <span className="truncate text-body-strong text-white">{taskTypeLabel(task.task_type)}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/60 transition-colors hover:bg-white/10"
        >
          Edit
        </button>
        <form
          action={deleteHomeworkTask}
          onSubmit={(e) => {
            if (!window.confirm("Delete this task? This cannot be undone.")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="group_id" value={groupId} />
          <button
            type="submit"
            className="w-full rounded-full border border-neon-pink/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neon-pink transition-colors hover:bg-neon-pink/10"
          >
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}
