"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";
import type { Json } from "@/types/database";

import AdminTaskContentFields from "./AdminTaskContentFields";
import {
  deleteMissionTask,
  publishMissionTask,
  unpublishMissionTask,
  updateMissionTask,
  type AdminFormState,
} from "./actions";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";
import { TASK_TYPES, taskTypeLabel, type MissionTaskType } from "./taskTypes";

export interface AdminTaskItemProps {
  missionId: string;
  task: {
    id: string;
    task_type: MissionTaskType;
    order_index: number;
    content: Json;
    is_published: boolean;
  };
  /** Task types offered in the dropdown — only published types. Defaults to all.
   * The task's own type is always included so an existing task stays editable
   * even if its type was later unpublished. */
  availableTypes?: MissionTaskType[];
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="sm" loading={pending}>
      Save
    </SlayButton>
  );
}

export default function AdminTaskItem({
  missionId,
  task,
  availableTypes = TASK_TYPES,
}: AdminTaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [editTaskType, setEditTaskType] = useState<MissionTaskType>(task.task_type);
  const [state, formAction] = useActionState<AdminFormState, FormData>(updateMissionTask, {});

  // Keep the task's own type selectable even if it's no longer published.
  const typeOptions = availableTypes.includes(task.task_type)
    ? availableTypes
    : [task.task_type, ...availableTypes];

  if (editing) {
    return (
      <li className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3">
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="mission_id" value={missionId} />

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
                {typeOptions.map((t) => (
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
        <span
          className={[
            "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
            task.is_published ? "bg-lime-green/20 text-lime-green" : "bg-cyan/20 text-cyan",
          ].join(" ")}
        >
          {task.is_published ? "Published" : "Draft"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/60 transition-colors hover:bg-white/10"
        >
          Edit
        </button>
        <form action={task.is_published ? unpublishMissionTask : publishMissionTask}>
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="mission_id" value={missionId} />
          <button
            type="submit"
            className={[
              "w-full rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
              task.is_published
                ? "border-white/20 text-white/60 hover:bg-white/10"
                : "border-lime-green/50 text-lime-green hover:bg-lime-green/10",
            ].join(" ")}
          >
            {task.is_published ? "Unpublish" : "Publish"}
          </button>
        </form>
        <form
          action={deleteMissionTask}
          onSubmit={(e) => {
            if (!window.confirm("Delete this task? This cannot be undone.")) {
              e.preventDefault();
            }
          }}
        >
          <button
            type="submit"
            className="w-full rounded-full border border-neon-pink/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neon-pink transition-colors hover:bg-neon-pink/10"
          >
            Delete
          </button>
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="mission_id" value={missionId} />
        </form>
      </div>

      <pre className="mt-3 max-h-24 overflow-auto rounded-lg bg-black/40 px-3 py-2 text-xs text-white/50">
        {JSON.stringify(task.content)}
      </pre>
    </li>
  );
}
