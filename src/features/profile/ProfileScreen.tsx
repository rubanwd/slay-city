"use client";

import { useFormStatus } from "react-dom";

import { signOut } from "@/features/auth/actions";
import { resetMissionProgress } from "@/features/mission/actions";

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
  email: string | null;
  avatarUrl?: string | null;
}

export default function ProfileScreen({ email, avatarUrl }: ProfileScreenProps) {
  const initial = (email ?? "?").charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-black flex flex-col mx-auto w-full max-w-md md:border-x md:border-white/10">
      <header className="flex items-center justify-center px-6 py-4 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">Profile</h1>
      </header>

      <section className="flex flex-1 flex-col gap-8 px-6 py-8 pb-28">
        <div className="flex flex-col items-center gap-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- user avatar, remote or static
            <img
              src={avatarUrl}
              alt=""
              className="h-24 w-24 rounded-full object-cover ring-2 ring-lime-green"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-lime-green text-3xl font-black text-black">
              {initial}
            </div>
          )}
          <p className="text-base font-semibold text-white break-all text-center">
            {email ?? "Signed in"}
          </p>
        </div>

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
