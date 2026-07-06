import { describe, expect, it } from "vitest";

import { computeStreakUpdate } from "./streak.ts";

// The Deno handler in index.ts is a thin shell around computeStreakUpdate: it
// validates the JWT, reads user_stats, delegates the decision to this pure
// function, then writes back. Exercising the pure function covers every streak
// rule the acceptance criteria call out, and it runs under Node/Vitest.
describe("computeStreakUpdate", () => {
  const TODAY = "2026-07-06";
  const YESTERDAY = "2026-07-05";
  const TWO_DAYS_AGO = "2026-07-04";

  it("increments the streak when the last activity was yesterday", () => {
    const result = computeStreakUpdate(
      { currentStreak: 4, longestStreak: 10, lastActivityDate: YESTERDAY },
      TODAY
    );

    expect(result).toEqual({
      currentStreak: 5,
      longestStreak: 10,
      lastActivityDate: TODAY,
      changed: true,
    });
  });

  it("does not double-count when the user was already active today", () => {
    const result = computeStreakUpdate(
      { currentStreak: 5, longestStreak: 10, lastActivityDate: TODAY },
      TODAY
    );

    // changed:false tells the handler to skip the write entirely.
    expect(result).toEqual({
      currentStreak: 5,
      longestStreak: 10,
      lastActivityDate: TODAY,
      changed: false,
    });
  });

  it("resets the streak to 1 when a day was missed", () => {
    const result = computeStreakUpdate(
      { currentStreak: 9, longestStreak: 12, lastActivityDate: TWO_DAYS_AGO },
      TODAY
    );

    expect(result).toEqual({
      currentStreak: 1,
      longestStreak: 12, // preserved — resets never lower the record
      lastActivityDate: TODAY,
      changed: true,
    });
  });

  it("starts a streak of 1 on the very first activity", () => {
    const result = computeStreakUpdate(
      { currentStreak: 0, longestStreak: 0, lastActivityDate: null },
      TODAY
    );

    expect(result).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: TODAY,
      changed: true,
    });
  });

  it("raises longest_streak when the continuing streak sets a new record", () => {
    const result = computeStreakUpdate(
      { currentStreak: 7, longestStreak: 7, lastActivityDate: YESTERDAY },
      TODAY
    );

    expect(result.currentStreak).toBe(8);
    expect(result.longestStreak).toBe(8);
  });

  it("treats a future last_activity_date (clock skew) as already counted", () => {
    const result = computeStreakUpdate(
      { currentStreak: 3, longestStreak: 5, lastActivityDate: "2026-07-07" },
      TODAY
    );

    expect(result.changed).toBe(false);
    expect(result.currentStreak).toBe(3);
  });
});
