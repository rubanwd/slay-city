import { signOut } from "@/features/auth/actions";

import type { TeacherGroup } from "./queries";

export interface TeacherDashboardProps {
  groups: TeacherGroup[];
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="flex flex-col items-center rounded-xl bg-white/5 px-2.5 py-1.5">
      <span className="text-body-strong font-black leading-none text-white">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-white/40">{label}</span>
    </span>
  );
}

/**
 * Read-only teacher dashboard: one section per group, each child shown as a
 * compact row with a few key stats. No per-child recent-activity list — a
 * class-sized group needs to stay scannable, unlike the single-child parent
 * dashboard this mirrors (`ParentDashboard.tsx`).
 */
export default function TeacherDashboard({ groups }: TeacherDashboardProps) {
  const header = (
    <header className="flex items-center justify-between gap-3 py-5">
      <div className="min-w-0">
        <h1 className="text-h2 font-black text-white">Teacher Dashboard</h1>
        <p className="truncate text-small text-white/50">
          {groups.length === 0
            ? "No groups yet"
            : `${groups.length} ${groups.length === 1 ? "group" : "groups"}`}
        </p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-neon-pink/40 px-3.5 py-2 text-xs font-semibold text-neon-pink transition-colors hover:bg-neon-pink/10"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log Out
        </button>
      </form>
    </header>
  );

  if (groups.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
          {header}
          <section className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] px-5 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan/10 text-cyan">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <h2 className="text-h3 font-bold text-white">No groups assigned yet</h2>
            <p className="max-w-xs text-small text-white/60">
              An admin will assign your groups of students. They&apos;ll appear here once set up.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        {header}

        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.id} aria-label={group.name}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-label text-white/50">{group.name}</h2>
                <span className="text-small font-bold text-white/40">
                  {group.children.length} {group.children.length === 1 ? "student" : "students"}
                </span>
              </div>
              {group.children.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
                  No students in this group yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {group.children.map((child) => (
                    <li
                      key={child.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3"
                    >
                      <span className="min-w-0 truncate text-body-strong text-white">
                        {child.username}
                      </span>
                      <div className="flex shrink-0 gap-2">
                        <StatChip label="Missions" value={child.progress.missionsCompleted} />
                        <StatChip label="Streak" value={child.progress.currentStreak} />
                        <StatChip
                          label="Places"
                          value={`${child.progress.locationsUnlocked}/${child.progress.totalLocations}`}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
