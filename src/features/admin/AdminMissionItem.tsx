"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import { publishMission, unpublishMission, updateMission, type AdminFormState } from "./actions";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

export interface AdminMissionItemData {
  id: string;
  title: string;
  description: string | null;
  xp_reward: number;
  coin_reward: number;
  is_published: boolean;
  location_id: string;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="sm" loading={pending}>
      Save
    </SlayButton>
  );
}

export default function AdminMissionItem({ mission }: { mission: AdminMissionItemData }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState<AdminFormState, FormData>(updateMission, {});

  if (editing) {
    return (
      <li className="rounded-xl border border-white/10 bg-black/30 px-3 py-3">
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={mission.id} />
          <input type="hidden" name="location_id" value={mission.location_id} />

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Title</span>
            <input name="title" defaultValue={mission.title} className={INPUT_CLASS} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Description</span>
            <textarea
              name="description"
              rows={2}
              defaultValue={mission.description ?? ""}
              className={INPUT_CLASS}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL_CLASS}>XP Reward</span>
              <input
                name="xp_reward"
                type="number"
                min={0}
                defaultValue={mission.xp_reward}
                className={INPUT_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL_CLASS}>Coin Reward</span>
              <input
                name="coin_reward"
                type="number"
                min={0}
                defaultValue={mission.coin_reward}
                className={INPUT_CLASS}
              />
            </label>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
            <span className="text-body-strong text-white">Published</span>
            <input
              name="is_published"
              type="checkbox"
              defaultChecked={mission.is_published}
              className="h-5 w-5 shrink-0 accent-lime-green"
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
    <li className="rounded-xl border border-white/10 bg-black/30 px-3 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-small font-bold text-white">{mission.title}</span>
        <span
          className={[
            "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
            mission.is_published ? "bg-lime-green/20 text-lime-green" : "bg-cyan/20 text-cyan",
          ].join(" ")}
        >
          {mission.is_published ? "Published" : "Draft"}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-white/40">
        {mission.xp_reward} XP · {mission.coin_reward} coins
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full border border-white/20 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white/60 transition-colors hover:bg-white/10"
        >
          Edit
        </button>
        <form action={mission.is_published ? unpublishMission : publishMission}>
          <input type="hidden" name="id" value={mission.id} />
          <button
            type="submit"
            className={[
              "w-full rounded-full border px-2 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors",
              mission.is_published
                ? "border-white/20 text-white/60 hover:bg-white/10"
                : "border-lime-green/50 text-lime-green hover:bg-lime-green/10",
            ].join(" ")}
          >
            {mission.is_published ? "Unpublish" : "Publish"}
          </button>
        </form>
        <Link
          href={`/admin/missions/${mission.id}/tasks`}
          className="flex items-center justify-center rounded-full border border-cyan/50 px-2 py-1 text-center text-[11px] font-bold uppercase tracking-wide text-cyan transition-colors hover:bg-cyan/10"
        >
          Tasks
        </Link>
      </div>
    </li>
  );
}
