"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { fillMissionImageSlot, getMissionImagePlan } from "./missionImageActions";

export interface MissionImageButtonProps {
  missionId: string;
  /** Total image slots across the mission's tasks (server-computed). */
  total: number;
  /** How many of those are still empty (server-computed). */
  missing: number;
}

interface Summary {
  generated: number;
  reused: number;
  errors: number;
}

/**
 * Per-mission bulk image filler. Shows how many pictures the mission's tasks
 * need; when any are missing it offers a "Generate images" button that fills
 * them one slot at a time (reusing the shared library, so repeated words cost
 * nothing) with a live progress count. Once every slot is filled the button is
 * replaced by a quiet "Images ready" marker.
 */
export default function MissionImageButton({ missionId, total, missing }: MissionImageButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; of: number } | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // No image-capable tasks in this mission — nothing to show.
  if (total === 0) return null;

  const filled = total - missing;

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    setSummary(null);
    setProgress({ done: 0, of: missing });

    const plan = await getMissionImagePlan(missionId);
    if (!plan.ok) {
      setError(plan.error);
      setBusy(false);
      setProgress(null);
      return;
    }

    const result: Summary = { generated: 0, reused: 0, errors: 0 };
    setProgress({ done: 0, of: plan.pending.length });

    for (let i = 0; i < plan.pending.length; i++) {
      const slot = plan.pending[i];
      const res = await fillMissionImageSlot(slot.taskId, slot.slotIndex);
      if (!res.ok) {
        result.errors += 1;
      } else if (res.status === "generated") {
        result.generated += 1;
      } else if (res.status === "reused") {
        result.reused += 1;
      }
      setProgress({ done: i + 1, of: plan.pending.length });
    }

    setSummary(result);
    setBusy(false);
    setProgress(null);
    // Re-run the server component so the counts (and per-task badges) refresh.
    router.refresh();
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5 border-t border-white/10 pt-2">
      {missing === 0 ? (
        <span className="inline-flex w-fit items-center gap-1 rounded-md bg-lime-green/15 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-lime-green">
          🖼 Images ready · {total}/{total}
        </span>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-white/50">
              🖼 {filled}/{total} images · {missing} to generate
            </span>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={busy}
              className="rounded-full border border-neon-pink/50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-neon-pink transition-colors hover:bg-neon-pink/10 disabled:opacity-50"
            >
              {busy
                ? progress
                  ? `Generating ${progress.done}/${progress.of}…`
                  : "Working…"
                : "Generate images"}
            </button>
          </div>
        </>
      )}

      {summary && !busy && (
        <span className="text-[11px] text-white/50">
          Done — {summary.generated} generated, {summary.reused} reused
          {summary.errors > 0 ? `, ${summary.errors} failed` : ""}.
        </span>
      )}
      {error && (
        <span role="alert" className="text-[11px] font-semibold text-neon-pink">
          {error}
        </span>
      )}
    </div>
  );
}
