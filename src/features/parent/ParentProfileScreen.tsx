"use client";

import { useFormStatus } from "react-dom";

import { BottomNav, BOTTOM_NAV_CLEARANCE } from "@/components/layout";
import { signOut } from "@/features/auth/actions";
import { getMessages, LOCALE_LABELS, type Locale } from "@/features/i18n";
import LocalePicker from "@/features/i18n/LocalePicker";
import { KNOWLEDGE_LEVEL_LABELS } from "@/features/levels/levels";
import ProfileUsernameCard from "@/features/profile/ProfileUsernameCard";
import type { KnowledgeLevel } from "@/types";

function LogoutButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
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
      {pending ? pendingLabel : label}
    </button>
  );
}

export interface ParentProfileScreenProps {
  username: string | null;
  email: string | null;
  /** Language the console renders in, and where that language came from. */
  locale: Locale;
  manualLocale: boolean;
  detectedLocale: Locale;
  /** The linked student's name and level — read-only; null while none is linked. */
  student: { username: string | null; level: KnowledgeLevel } | null;
}

/**
 * The parent's own account screen.
 *
 * Deliberately smaller than the student's: a parent has no mascot to wear and
 * no knowledge level of their own — the level belongs to the student, is chosen
 * by the student, and is shown here (and on the dashboard) purely as
 * information. What a parent *can* set is the language of this console.
 */
export default function ParentProfileScreen({
  username,
  email,
  locale,
  manualLocale,
  detectedLocale,
  student,
}: ParentProfileScreenProps) {
  const messages = getMessages(locale);

  return (
    <main className="min-h-screen bg-black flex flex-col mx-auto w-full max-w-md md:border-x md:border-white/10">
      <header className="flex items-center justify-center px-6 py-4 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">{messages.profile.title}</h1>
      </header>

      <section className={`flex flex-1 flex-col gap-6 px-6 py-8 ${BOTTOM_NAV_CLEARANCE}`}>
        <div className="flex flex-col items-center gap-1">
          {username && (
            <p className="text-xl font-black text-white break-words text-center">{username}</p>
          )}
          <p className="text-sm text-white/50 break-all text-center">
            {email ?? messages.profile.signedIn}
          </p>
          <span className="mt-1 rounded-full border border-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/60">
            {messages.profile.roleLabel}
          </span>
        </div>

        <ProfileUsernameCard username={username} messages={messages.profile} />

        <LocalePicker
          locale={locale}
          title={messages.profile.languageTitle}
          hint={messages.profile.languageHint}
          auto={{
            label: messages.profile.languageAuto,
            selected: !manualLocale,
            hint: messages.profile.languageAutoHint(LOCALE_LABELS[detectedLocale]),
          }}
        />

        <section
          aria-label={messages.profile.studentTitle}
          className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-[#1a1a1a] p-4"
        >
          <h2 className="text-label text-white/50">{messages.profile.studentTitle}</h2>
          {student ? (
            <>
              <p className="text-body-strong text-white">
                {student.username ?? messages.dashboard.yourStudent}
              </p>
              <p className="text-small text-white/60">
                {messages.dashboard.englishLevel}:{" "}
                <span className="font-bold text-white/80">
                  {KNOWLEDGE_LEVEL_LABELS[student.level]}
                </span>
              </p>
              <p className="text-small text-white/35">{messages.profile.studentLevelHint}</p>
            </>
          ) : (
            <p className="text-small text-white/50">{messages.profile.studentNone}</p>
          )}
        </section>

        <div className="mt-auto">
          <form action={signOut}>
            <LogoutButton
              label={messages.common.logOut}
              pendingLabel={messages.common.loggingOut}
            />
          </form>
        </div>
      </section>

      <BottomNav
        role="parent"
        labels={{
          dashboard: messages.nav.dashboard,
          map: messages.nav.map,
          profile: messages.nav.profile,
        }}
      />
    </main>
  );
}
