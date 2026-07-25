"use client";

import { useEffect, useRef } from "react";

import { recordStudyTime } from "./actions";
import { STUDY_HEARTBEAT_SECONDS } from "./heartbeat";

/**
 * Invisible heartbeat that records how long a student spends on a learning
 * screen — mounted on the mission player and on homework topics, the only two
 * places where learning actually happens.
 *
 * It ticks once every {@link STUDY_HEARTBEAT_SECONDS} and only while the tab is
 * visible, so a mission left open in a background tab (or on a locked phone)
 * stops counting. Each tick reports the interval that has just elapsed rather
 * than a running total, which keeps the report additive: a dropped call loses
 * that half-minute and nothing else.
 *
 * The value is advisory only — the server clamps it, ignores anyone who is not
 * a student, and buckets it per day.
 */
export default function StudyTimeTracker() {
  // Guards against React's development double-mount starting two intervals.
  const runningRef = useRef(false);

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void recordStudyTime(STUDY_HEARTBEAT_SECONDS);
    }, STUDY_HEARTBEAT_SECONDS * 1000);

    return () => {
      clearInterval(interval);
      runningRef.current = false;
    };
  }, []);

  return null;
}
