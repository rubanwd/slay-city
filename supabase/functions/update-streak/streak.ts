/**
 * Pure, runtime-agnostic streak calculation shared by the Edge Function
 * handler and its unit tests.
 *
 * This module intentionally has NO Deno or Supabase dependencies so it can run
 * unchanged under both the Deno edge runtime (imported by index.ts) and the
 * Node/Vitest test runner (imported by index.test.ts).
 */

/** A calendar date in ISO `YYYY-MM-DD` form (matches the Postgres `date` type). */
export type IsoDate = string;

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  /** Last day the user completed a mission, or null if they never have. */
  lastActivityDate: IsoDate | null;
}

export interface StreakUpdate {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: IsoDate;
  /**
   * False when the user had already been active today, signalling the caller
   * to skip the write entirely because nothing changed.
   */
  changed: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Whole calendar days from `from` to `to`, compared at UTC midnight so the
 * result is unaffected by daylight-saving transitions. Yesterday → today = 1.
 */
function daysBetween(from: IsoDate, to: IsoDate): number {
  const fromMs = Date.parse(`${from}T00:00:00Z`);
  const toMs = Date.parse(`${to}T00:00:00Z`);
  return Math.round((toMs - fromMs) / MS_PER_DAY);
}

/**
 * Given the user's stored streak state and today's date, compute the next
 * state. The rules are:
 *   - already active today      → no change (`changed: false`)
 *   - active yesterday          → streak + 1
 *   - older than yesterday/never→ streak resets to 1
 *
 * `longestStreak` only ever grows. A `lastActivityDate` in the future (clock
 * skew) is treated the same as "already active today" so the streak is never
 * silently reset by an out-of-order request.
 */
export function computeStreakUpdate(state: StreakState, today: IsoDate): StreakUpdate {
  const { lastActivityDate, longestStreak } = state;

  // Never active before → first day of a brand-new streak.
  if (lastActivityDate === null) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(longestStreak, 1),
      lastActivityDate: today,
      changed: true,
    };
  }

  const gap = daysBetween(lastActivityDate, today);

  // Same day (gap 0) or a future date (gap < 0): already counted for today.
  if (gap <= 0) {
    return {
      currentStreak: state.currentStreak,
      longestStreak,
      lastActivityDate,
      changed: false,
    };
  }

  // Consecutive day continues the run; any larger gap starts over at 1.
  const currentStreak = gap === 1 ? state.currentStreak + 1 : 1;

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastActivityDate: today,
    changed: true,
  };
}

/** Today's date in UTC as `YYYY-MM-DD`. */
export function todayUtc(now: Date = new Date()): IsoDate {
  return now.toISOString().slice(0, 10);
}
