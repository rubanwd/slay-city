"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";
import type { Database } from "@/types/database";

import { createMissionTask, type AdminFormState } from "./actions";

type MissionTaskType = Database["public"]["Enums"]["mission_task_type"];

const TASK_TYPES: MissionTaskType[] = ["vocabulary", "matching", "listening", "quiz"];

export interface AdminTaskFormProps {
  missionId: string;
  /** Suggested order for the next task (usually current task count). */
  nextOrder: number;
}

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 caret-neon-pink " +
  "border border-white/20 transition-colors " +
  "focus:outline-none focus:bg-white/15 focus:border-neon-pink focus:ring-2 focus:ring-neon-pink/60";

const LABEL_CLASS = "text-label text-white/50 uppercase tracking-widest";

const CONTENT_PLACEHOLDER = `{
  "prompt": "Choose the correct word",
  "options": ["cat", "dog"],
  "answer": "cat"
}`;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="md" loading={pending} className="w-full">
      Add Task
    </SlayButton>
  );
}

export default function AdminTaskForm({ missionId, nextOrder }: AdminTaskFormProps) {
  const [state, formAction] = useActionState<AdminFormState, FormData>(createMissionTask, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="mission_id" value={missionId} />

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Task Type</span>
          <select name="task_type" required defaultValue="vocabulary" className={INPUT_CLASS}>
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

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Content (JSON)</span>
        <textarea
          name="content"
          rows={6}
          placeholder={CONTENT_PLACEHOLDER}
          className={`${INPUT_CLASS} font-mono text-small`}
        />
        <span className="text-xs text-white/40">
          Optional. Task-specific data (prompt, options, answer…) as valid JSON.
        </span>
      </label>

      {state.error && (
        <p role="alert" className="text-sm font-semibold text-neon-pink">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm font-semibold text-lime-green">
          {state.success}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
