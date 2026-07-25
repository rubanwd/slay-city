"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";
import { signOut } from "@/features/auth/actions";
import LevelPicker from "@/features/levels/LevelPicker";
import LockedLevelsNote from "@/features/levels/LockedLevelsNote";
import { resolveSelectableLevel } from "@/features/levels/levels";
import type { KnowledgeLevel } from "@/types";

import { createProfile, type OnboardingState } from "./actions";

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 caret-neon-pink " +
  "border border-white/20 transition-colors " +
  "focus:outline-none focus:bg-white/15 focus:border-neon-pink " +
  "focus:ring-2 focus:ring-neon-pink/60";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="lg" loading={pending} className="w-full">
      Enter the City →
    </SlayButton>
  );
}

/**
 * Escape hatch out of onboarding. A signed-in user with no profile row is
 * pinned here by middleware — every other route bounces back — so signing out
 * is the only way to reach the login screen (e.g. to use a different account).
 */
function SignOutLink() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm text-white/40 underline underline-offset-4 hover:text-white/70 disabled:opacity-50 transition-colors"
    >
      {pending ? "Signing out…" : "Not you? Log out"}
    </button>
  );
}

export interface OnboardingFormProps {
  /** Levels that already have content — the only ones a student may start on. */
  levels: readonly KnowledgeLevel[];
}

export default function OnboardingForm({ levels }: OnboardingFormProps) {
  const [state, formAction] = useActionState<OnboardingState, FormData>(createProfile, {});
  // Pre-selects the first available level (Elementary today) so the student can
  // submit without thinking about it, while still being able to change it.
  const [level, setLevel] = useState<KnowledgeLevel | null>(() =>
    resolveSelectableLevel(levels, null)
  );

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <form action={formAction} className="w-full flex flex-col gap-6">
        <h1 className="text-h1 font-black text-white tracking-tight text-center">
          Create Your <span className="text-neon-pink">Profile</span>
        </h1>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-white/50 uppercase tracking-widest">Username</span>
          <input
            name="username"
            type="text"
            required
            minLength={2}
            maxLength={20}
            placeholder="Enter your name"
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-white/50 uppercase tracking-widest">
            Age <span className="normal-case text-white/30">(optional)</span>
          </span>
          {/* Placeholder stays "7-14" as the suggested range; the accepted range
              is wider so older and younger players aren't blocked. */}
          <input
            name="age"
            type="number"
            min={5}
            max={20}
            placeholder="7-14"
            className={INPUT_CLASS}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-label text-white/50 uppercase tracking-widest">Level</span>
          {levels.length === 0 ? (
            <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-small text-white/50">
              No levels are open yet — you&apos;ll be able to pick one as soon as the city has
              content.
            </p>
          ) : (
            <>
              <LevelPicker levels={levels} value={level} onChange={setLevel} name="level" />
              <LockedLevelsNote available={levels} />
            </>
          )}
        </div>

        {state.error && (
          <p role="alert" className="text-sm font-semibold text-neon-pink text-center">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>

      <form action={signOut}>
        <SignOutLink />
      </form>
    </div>
  );
}
