"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";
import type { Database } from "@/types/database";

import {
  deleteMissionTask,
  publishMissionTask,
  unpublishMissionTask,
  updateMissionTask,
  type AdminFormState,
} from "./actions";

type MissionTaskType = Database["public"]["Enums"]["mission_task_type"];

const TASK_TYPES: MissionTaskType[] = ["vocabulary", "matching", "listening", "quiz"];

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 caret-neon-pink " +
  "border border-white/20 transition-colors " +
  "focus:outline-none focus:bg-white/15 focus:border-neon-pink focus:ring-2 focus:ring-neon-pink/60";

const LABEL_CLASS = "text-label text-white/50 uppercase tracking-widest";

export interface AdminTaskItemProps {
  missionId: string;
  task: {
    id: string;
    task_type: MissionTaskType;
    order_index: number;
    content: unknown;
    is_published: boolean;
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

export default function AdminTaskItem({ missionId, task }: AdminTaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState<AdminFormState, FormData>(updateMissionTask, {});

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
                defaultValue={task.task_type}
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
                defaultValue={task.order_index}
                className={INPUT_CLASS}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Content (JSON)</span>
            <textarea
              name="content"
              rows={6}
              defaultValue={JSON.stringify(task.content, null, 2)}
              className={`${INPUT_CLASS} font-mono text-small`}
            />
          </label>

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
    <li className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white/70">
            {task.order_index}
          </span>
          <span className="truncate text-body-strong capitalize text-white">
            {task.task_type}
          </span>
          <span
            className={[
              "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
              task.is_published ? "bg-lime-green/20 text-lime-green" : "bg-cyan/20 text-cyan",
            ].join(" ")}
          >
            {task.is_published ? "Published" : "Draft"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
                "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
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
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="mission_id" value={missionId} />
            <button
              type="submit"
              className="rounded-full border border-neon-pink/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neon-pink transition-colors hover:bg-neon-pink/10"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
      <pre className="mt-2 max-h-24 overflow-auto rounded-lg bg-black/40 px-3 py-2 text-xs text-white/50">
        {JSON.stringify(task.content)}
      </pre>
    </li>
  );
}
