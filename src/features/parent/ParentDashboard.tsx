import Link from "next/link";

import type { ParentProgressSummary } from "./queries";

export interface ParentDashboardProps {
  /** Display name for the child whose progress is shown. */
  childName: string;
  summary: ParentProgressSummary;
}

/* Formats an ISO timestamp as a short, adult-readable date like "Jul 8, 2026". */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Small building blocks ─────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-[#1a1a1a] p-4">
      <span className="text-label text-white/50">{label}</span>
      <span className={`text-3xl font-black leading-none ${accent}`}>{value}</span>
    </div>
  );
}

/* ── Dashboard ─────────────────────────────────────────────────────────────── */

/**
 * Read-only parent dashboard. Adult-facing: calmer than the child game screens
 * (no glow/animation) but still on-brand — dark surface, neon accents, rounded
 * cards. Rendered as a plain server component; all data arrives via props.
 */
export default function ParentDashboard({ childName, summary }: ParentDashboardProps) {
  const {
    missionsCompleted,
    currentStreak,
    longestStreak,
    locationsUnlocked,
    totalLocations,
    vocabularyCount,
    recentActivity,
  } = summary;

  const progressPct =
    totalLocations > 0 ? Math.round((locationsUnlocked / totalLocations) * 100) : 0;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex items-center gap-3 py-5">
          <Link
            href="/map"
            aria-label="Back to map"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="text-h2 font-black text-white">Parent Dashboard</h1>
            <p className="text-small text-white/50">{childName}&apos;s progress</p>
          </div>
        </header>

        {/* ── Vocabulary highlight ───────────────────────────────────────── */}
        <section
          aria-label="Vocabulary learned"
          className="rounded-2xl border border-neon-pink/40 bg-gradient-to-br from-neon-pink/15 to-transparent p-5"
        >
          <p className="text-label text-white/60">Vocabulary Learned</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-black leading-none text-neon-pink">
              {vocabularyCount}
            </span>
            <span className="text-h3 font-bold text-white/80">
              {vocabularyCount === 1 ? "Word" : "Words"}
            </span>
          </p>
        </section>

        {/* ── Overview stats ─────────────────────────────────────────────── */}
        <section aria-label="Overview" className="mt-4 grid grid-cols-2 gap-3">
          <StatCard
            label="Missions Completed"
            value={missionsCompleted}
            accent="text-lime-green"
          />
          <StatCard label="Current Streak" value={currentStreak} accent="text-neon-pink" />
          <StatCard label="Longest Streak" value={longestStreak} accent="text-cyan" />
          <StatCard
            label="Locations Unlocked"
            value={`${locationsUnlocked}/${totalLocations}`}
            accent="text-purple"
          />
        </section>

        {/* ── Map progress bar ───────────────────────────────────────────── */}
        <section aria-label="City map progress" className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-label text-white/50">City Map Progress</h2>
            <span className="text-small font-bold text-white/70">{progressPct}%</span>
          </div>
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={locationsUnlocked}
            aria-valuemin={0}
            aria-valuemax={totalLocations}
          >
            <div
              className="h-full rounded-full bg-lime-green transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-small text-white/50">
            {locationsUnlocked} of {totalLocations} locations unlocked
          </p>
        </section>

        {/* ── Recent activity ────────────────────────────────────────────── */}
        <section aria-label="Recent activity" className="mt-6">
          <h2 className="mb-3 text-label text-white/50">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
              No missions completed yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentActivity.map((item) => (
                <li
                  key={item.missionId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-green/15 text-lime-green">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    <span className="truncate text-body-strong text-white">{item.title}</span>
                  </div>
                  <span className="shrink-0 text-small text-white/50">
                    {formatDate(item.completedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
