"use client";

import { useFormStatus } from "react-dom";

import { BOTTOM_NAV_CLEARANCE } from "@/components/layout";
import SlayCharacter from "@/components/ui/SlayCharacter";
import { signOut } from "@/features/auth/actions";
import { resetMissionProgress } from "@/features/mission/actions";
import type { KnowledgeLevel } from "@/types";

import ProfileLevelCard from "./ProfileLevelCard";

function LogoutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={[
        "flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold",
        "border border-neon-pink/40 text-neon-pink hover:bg-neon-pink/10 active:bg-neon-pink/5",
        "disabled:pointer-events-none disabled:opacity-50 transition-colors",
      ].join(" ")}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      {pending ? "Logging out…" : "Log Out"}
    </button>
  );
}

/**
 * TEMPORARY dev/test action — wipes the current user's mission progress and
 * stats so content can be replayed. Exposed to everyone for now; before launch
 * this should be gated to admins only (or removed). See {@link resetMissionProgress}.
 */
function ResetProgressButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={[
        "flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold",
        "border border-amber-400/40 text-amber-400 hover:bg-amber-400/10 active:bg-amber-400/5",
        "disabled:pointer-events-none disabled:opacity-50 transition-colors",
      ].join(" ")}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
      {pending ? "Resetting…" : "Reset Progress (dev)"}
    </button>
  );
}

export interface ProfileScreenProps {
  /** Display name chosen at signup; null only for profiles predating onboarding. */
  username: string | null;
  email: string | null;
  /** The player's snake wearing their currently equipped wardrobe item. */
  mascotImageUrl: string;
  /** The knowledge level whose districts the player's map is showing. */
  level: KnowledgeLevel;
  /** Levels with content — what the player can switch to. */
  availableLevels: readonly KnowledgeLevel[];
}

export default function ProfileScreen({
  username,
  email,
  mascotImageUrl,
  level,
  availableLevels,
}: ProfileScreenProps) {
  return (
    <main className="min-h-screen bg-black flex flex-col mx-auto w-full max-w-md md:border-x md:border-white/10">
      <header className="flex items-center justify-center px-6 py-4 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">Profile</h1>
      </header>

      <section className={`flex flex-1 flex-col gap-8 px-6 py-8 ${BOTTOM_NAV_CLEARANCE}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/5 p-2 ring-2 ring-lime-green">
            <SlayCharacter size="full" src={mascotImageUrl} aria-label="Your character" />
          </div>
          <div className="flex flex-col items-center gap-1">
            {username && (
              <p className="text-xl font-black text-white break-words text-center">{username}</p>
            )}
            <p className="text-sm text-white/50 break-all text-center">{email ?? "Signed in"}</p>
          </div>
        </div>

        <ProfileLevelCard current={level} available={availableLevels} />

        <div className="mt-auto flex flex-col gap-3">
          {/* TEMPORARY: dev-only progress reset. Remove or gate to admins before launch. */}
          <form
            action={async () => {
              const result = await resetMissionProgress();
              if (!result.ok) {
                window.alert(result.error);
              }
            }}
            onSubmit={(event) => {
              if (
                !window.confirm(
                  "Wipe all your mission progress, XP, coins, and streaks? This can't be undone."
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            <ResetProgressButton />
          </form>

          <form action={signOut}>
            <LogoutButton />
          </form>
        </div>
      </section>
    </main>
  );
}
