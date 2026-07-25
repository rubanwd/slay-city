/**
 * How long one heartbeat of study time covers.
 *
 * Lives outside `actions.ts` because a `"use server"` module may only export
 * async functions — a constant there breaks the build. Kept in sync with the
 * clamp inside `record_study_time` (20260725000004_study_time.sql), which
 * refuses anything larger than two minutes.
 */
export const STUDY_HEARTBEAT_SECONDS = 30;
