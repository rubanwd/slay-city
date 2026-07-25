import { BottomNav, ScrollScreen, BOTTOM_NAV_CLEARANCE } from "@/components/layout";
import { CoinAmount, SlayCharacter, XpAmount } from "@/components/ui";
import { signOut } from "@/features/auth/actions";
import { formatDate, formatDuration, getMessages, type Locale } from "@/features/i18n";
import { KNOWLEDGE_LEVEL_LABELS } from "@/features/levels/levels";

import type { HomeworkTopicProgress, ParentDashboardData } from "./queries";
import type { StudyTimeSummary } from "@/features/study/queries";

/** Why no student progress is shown yet (see `link_student_by_email` reason codes). */
export type PendingReason =
  | "student_not_registered"
  | "student_no_profile"
  | "not_a_student"
  | "no_email"
  | string;

export interface PendingLink {
  /** The student email the parent registered with, if any. */
  studentEmail: string | null;
  reason: PendingReason;
}

export interface ParentDashboardProps {
  /** Language the whole console is rendered in — resolved server-side. */
  locale: Locale;
  /** Display name for the student whose progress is shown (linked state). */
  studentName?: string;
  /** Everything known about the linked student — present once one is linked. */
  data?: ParentDashboardData;
  /** Present instead of `data` when no student is linked yet. */
  pending?: PendingLink;
}

/** Human-readable explanation for each not-yet-linked reason. */
function pendingMessage(
  locale: Locale,
  studentEmail: string | null,
  reason: PendingReason
): string {
  const messages = getMessages(locale).dashboard;
  const who = studentEmail ? `"${studentEmail}"` : messages.yourStudent;
  switch (reason) {
    case "student_no_profile":
      return messages.pendingNoProfile(who);
    case "not_a_student":
      return messages.pendingNotAStudent(who);
    case "no_email":
      return messages.pendingNoEmail;
    case "student_not_registered":
    default:
      return messages.pendingNotRegistered(who);
  }
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

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3 flex flex-col gap-0.5">
      <h2 className="text-label text-white/50">{title}</h2>
      {hint && <p className="text-small text-white/35">{hint}</p>}
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
      {text}
    </p>
  );
}

/* ── Sections ──────────────────────────────────────────────────────────────── */

/**
 * Who the student is today: the look they are wearing in the wardrobe, their
 * chosen English level, and what the game has paid them so far. The level lives
 * here rather than on the parent's own profile — it is the student's choice,
 * and a parent only ever needs to see it.
 */
function StudentCard({
  locale,
  data,
  fallbackName,
}: {
  locale: Locale;
  data: ParentDashboardData;
  fallbackName: string;
}) {
  const messages = getMessages(locale);
  const { student } = data;

  return (
    <section
      aria-label={messages.profile.studentTitle}
      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#1a1a1a] p-4"
    >
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/5 p-1.5 ring-2 ring-lime-green">
        <SlayCharacter
          size="full"
          src={student.mascotImageUrl}
          aria-label={messages.dashboard.lookLabel}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="truncate text-lg font-black text-white">
          {student.username ?? fallbackName}
        </p>
        <p className="text-small text-white/50">
          {messages.dashboard.englishLevel}:{" "}
          <span className="font-bold text-white/80">
            {KNOWLEDGE_LEVEL_LABELS[student.level]}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-white/70">
          <XpAmount value={student.xp} label={`${student.xp} ${messages.dashboard.xp}`} />
          <CoinAmount
            value={student.coins}
            label={`${student.coins} ${messages.dashboard.coins}`}
            className="text-yellow-300"
          />
        </div>
        <p className="text-small text-white/40">
          {messages.dashboard.lastActive}:{" "}
          {student.lastActivityDate
            ? formatDate(locale, student.lastActivityDate)
            : messages.common.never}
        </p>
      </div>
    </section>
  );
}

/**
 * Time on task — the question a dashboard full of counters cannot answer.
 *
 * Recorded only while a mission or a homework module is actually open (see
 * `StudyTimeTracker`), so it is time spent learning rather than time signed in.
 * Nothing is back-filled: a student who has been playing for months starts at
 * zero here, which the empty state says plainly instead of implying they never
 * worked.
 */
function StudyTimeSection({ locale, studyTime }: { locale: Locale; studyTime: StudyTimeSummary }) {
  const messages = getMessages(locale).dashboard;
  const peak = Math.max(...studyTime.week.map((day) => day.seconds), 1);

  return (
    <section aria-label={messages.studyTimeTitle} className="mt-4">
      <SectionHeading title={messages.studyTimeTitle} hint={messages.studyTimeHint} />

      {studyTime.totalSeconds === 0 ? (
        <EmptyCard text={messages.studyTimeEmpty} />
      ) : (
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#1a1a1a] p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: messages.studyTimeToday, seconds: studyTime.todaySeconds },
              { label: messages.studyTimeWeek, seconds: studyTime.weekSeconds },
              { label: messages.studyTimeTotal, seconds: studyTime.totalSeconds },
            ].map((entry) => (
              <div key={entry.label} className="flex flex-col gap-1">
                <span className="text-label text-white/50">{entry.label}</span>
                <span className="text-lg font-black leading-none text-cyan">
                  {formatDuration(locale, entry.seconds)}
                </span>
              </div>
            ))}
          </div>

          {/* Seven-day shape: relative bars, so a quiet day reads as quiet
              without needing an axis. */}
          <div className="flex items-end justify-between gap-1.5" aria-hidden="true">
            {studyTime.week.map((day) => (
              <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-16 w-full items-end rounded-md bg-white/5">
                  <div
                    className="w-full rounded-md bg-cyan/70"
                    style={{ height: `${Math.round((day.seconds / peak) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-white/35">
                  {messages.weekdayInitials[(new Date(`${day.day}T00:00:00.000Z`).getUTCDay() + 6) % 7]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/** What kind of practice the finished tasks were, as a share of the whole. */
function PracticeSection({ locale, data }: { locale: Locale; data: ParentDashboardData }) {
  const messages = getMessages(locale).dashboard;
  const { taskFamilies, tasksCompleted } = data.progress;

  return (
    <section aria-label={messages.practiceTitle} className="mt-6">
      <SectionHeading title={messages.practiceTitle} hint={messages.practiceHint} />

      {taskFamilies.length === 0 ? (
        <EmptyCard text={messages.practiceEmpty} />
      ) : (
        <ul className="flex flex-col gap-2">
          {taskFamilies.map((entry) => {
            const share = tasksCompleted > 0 ? Math.round((entry.count / tasksCompleted) * 100) : 0;
            return (
              <li
                key={entry.family}
                className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-body-strong text-white">
                    {messages.families[entry.family]}
                  </span>
                  <span className="shrink-0 text-small font-bold text-white/60">
                    {entry.count} {messages.tasks(entry.count)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-purple" style={{ width: `${share}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Status chip for one homework module (vocabulary or grammar). */
function ModuleChip({ label, done }: { label: string; done: boolean }) {
  return (
    <span
      className={[
        "rounded-full px-2.5 py-1 text-[11px] font-bold",
        done ? "bg-lime-green/15 text-lime-green" : "bg-white/10 text-white/50",
      ].join(" ")}
    >
      {done ? "✓ " : ""}
      {label}
    </span>
  );
}

/** The topics the teacher assigned, and how far the student got in each. */
function HomeworkSection({
  locale,
  topics,
}: {
  locale: Locale;
  topics: readonly HomeworkTopicProgress[];
}) {
  const messages = getMessages(locale).dashboard;

  return (
    <section aria-label={messages.homeworkTitle} className="mt-6">
      <SectionHeading title={messages.homeworkTitle} hint={messages.homeworkHint} />

      {topics.length === 0 ? (
        <EmptyCard text={messages.homeworkEmpty} />
      ) : (
        <ul className="flex flex-col gap-2">
          {topics.map((topic) => {
            const status = topic.passed
              ? messages.homeworkPassed
              : topic.started
                ? messages.homeworkInProgress
                : messages.homeworkNotStarted;

            return (
              <li
                key={topic.topicId}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {/* Teacher-authored, shown exactly as written. */}
                    <p className="truncate text-body-strong text-white">{topic.title}</p>
                    <p className="truncate text-small text-white/40">
                      {topic.groupName}
                      {topic.teacherUsername
                        ? ` · ${messages.homeworkTeacher(topic.teacherUsername)}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={[
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap",
                      topic.passed
                        ? "bg-lime-green/15 text-lime-green"
                        : topic.started
                          ? "bg-yellow-300/15 text-yellow-300"
                          : "bg-white/10 text-white/50",
                    ].join(" ")}
                  >
                    {status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {topic.wordCount > 0 && (
                    <ModuleChip
                      label={`${messages.homeworkVocabulary} · ${messages.homeworkWords(topic.wordCount)}`}
                      done={topic.vocabCompletedAt !== null}
                    />
                  )}
                  {topic.grammarCount > 0 && (
                    <ModuleChip
                      label={`${messages.homeworkGrammar} · ${messages.homeworkRules(topic.grammarCount)}`}
                      done={topic.grammarCompletedAt !== null}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ── Dashboard ─────────────────────────────────────────────────────────────── */

/**
 * Read-only parent dashboard. Adult-facing: calmer than the student game screens
 * (no glow/animation) but still on-brand — dark surface, neon accents, rounded
 * cards. Rendered as a plain server component; all data arrives via props, and
 * every string comes from the dictionary for `locale` except content authored in
 * the database (mission, district and homework titles), which is shown as written.
 */
export default function ParentDashboard({
  locale,
  studentName,
  data,
  pending,
}: ParentDashboardProps) {
  const messages = getMessages(locale);
  const navLabels = {
    dashboard: messages.nav.dashboard,
    map: messages.nav.map,
    profile: messages.nav.profile,
  };

  const subtitle = pending
    ? pending.studentEmail
      ? messages.dashboard.linking(pending.studentEmail)
      : messages.dashboard.noStudentLinked
    : messages.dashboard.progressOf(
        data?.student.username ?? studentName ?? messages.dashboard.yourStudent
      );

  const header = (
    // No "back" affordance: the bottom nav is how parents move between this
    // dashboard, the map and their profile. A Log Out control is the way out.
    <header className="flex items-center justify-between gap-3 py-5">
      <div className="min-w-0">
        <h1 className="text-h2 font-black text-white">{messages.dashboard.title}</h1>
        <p className="truncate text-small text-white/50">{subtitle}</p>
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
          {messages.common.logOut}
        </button>
      </form>
    </header>
  );

  // ── Not linked to a student account yet ────────────────────────────────
  if (!data) {
    return (
      <ScrollScreen footer={<BottomNav role="parent" labels={navLabels} />}>
        <div className={`mx-auto flex w-full max-w-md flex-col px-5 ${BOTTOM_NAV_CLEARANCE}`}>
          {header}
          <section className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] px-5 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neon-pink/10 text-neon-pink">
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
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
              </svg>
            </span>
            <h2 className="text-h3 font-bold text-white">{messages.dashboard.pendingTitle}</h2>
            <p className="max-w-xs text-small text-white/60">
              {pendingMessage(
                locale,
                pending?.studentEmail ?? null,
                pending?.reason ?? "student_not_registered"
              )}
            </p>
          </section>
        </div>
      </ScrollScreen>
    );
  }

  const {
    missionsCompleted,
    currentStreak,
    longestStreak,
    locationsUnlocked,
    totalLocations,
    vocabularyCount,
    tasksCompleted,
    recentActivity,
  } = data.progress;

  const progressPct =
    totalLocations > 0 ? Math.round((locationsUnlocked / totalLocations) * 100) : 0;

  return (
    <ScrollScreen footer={<BottomNav role="parent" labels={navLabels} />}>
      <div className={`mx-auto flex w-full max-w-md flex-col px-5 ${BOTTOM_NAV_CLEARANCE}`}>
        {header}

        <StudentCard
          locale={locale}
          data={data}
          fallbackName={studentName ?? messages.dashboard.yourStudent}
        />

        {/* ── Vocabulary highlight ───────────────────────────────────────── */}
        <section
          aria-label={messages.dashboard.vocabularyTitle}
          className="mt-4 rounded-2xl border border-neon-pink/40 bg-gradient-to-br from-neon-pink/15 to-transparent p-5"
        >
          <p className="text-label text-white/60">{messages.dashboard.vocabularyTitle}</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-black leading-none text-neon-pink">
              {vocabularyCount}
            </span>
            <span className="text-h3 font-bold text-white/80">
              {messages.dashboard.words(vocabularyCount)}
            </span>
          </p>
        </section>

        <StudyTimeSection locale={locale} studyTime={data.studyTime} />

        {/* ── Overview stats ─────────────────────────────────────────────── */}
        <section aria-label={messages.dashboard.title} className="mt-4 grid grid-cols-2 gap-3">
          <StatCard
            label={messages.dashboard.missionsCompleted}
            value={missionsCompleted}
            accent="text-lime-green"
          />
          <StatCard
            label={messages.dashboard.tasksCompleted}
            value={tasksCompleted}
            accent="text-purple"
          />
          <StatCard
            label={messages.dashboard.currentStreak}
            value={`${currentStreak} ${messages.dashboard.days(currentStreak)}`}
            accent="text-neon-pink"
          />
          <StatCard
            label={messages.dashboard.longestStreak}
            value={`${longestStreak} ${messages.dashboard.days(longestStreak)}`}
            accent="text-cyan"
          />
        </section>

        {/* ── Map progress bar ───────────────────────────────────────────── */}
        <section aria-label={messages.dashboard.mapProgressTitle} className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-label text-white/50">{messages.dashboard.mapProgressTitle}</h2>
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
            {messages.dashboard.locationsUnlockedOf(locationsUnlocked, totalLocations)}
          </p>
        </section>

        <PracticeSection locale={locale} data={data} />

        <HomeworkSection locale={locale} topics={data.homework} />

        {/* ── Recent activity ────────────────────────────────────────────── */}
        <section aria-label={messages.dashboard.recentTitle} className="mt-6">
          <SectionHeading title={messages.dashboard.recentTitle} />
          {recentActivity.length === 0 ? (
            <EmptyCard text={messages.dashboard.recentEmpty} />
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
                    {/* Mission titles are authored content — never translated. */}
                    <span className="truncate text-body-strong text-white">{item.title}</span>
                  </div>
                  <span className="flex shrink-0 items-center gap-2 text-small text-white/50">
                    {item.score !== null && (
                      <span className="font-bold text-lime-green">
                        {messages.dashboard.recentScore(item.score)}
                      </span>
                    )}
                    {formatDate(locale, item.completedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ScrollScreen>
  );
}
