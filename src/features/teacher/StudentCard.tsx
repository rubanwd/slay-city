"use client";

import { useState } from "react";

import type { TeacherGroupChild } from "./queries";

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="flex flex-col items-center rounded-xl bg-white/5 px-2.5 py-1.5">
      <span className="text-body-strong font-black leading-none text-white">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-white/40">{label}</span>
    </span>
  );
}

/**
 * One student row on the teacher dashboard. Collapsed by default it stays
 * scannable — just the name and compact Topics/Missions stat chips. Tapping the
 * row expands the full per-topic pass breakdown, so the detail lives on the same
 * page without cluttering a class-sized list.
 */
export default function StudentCard({ child }: { child: TeacherGroupChild }) {
  const [expanded, setExpanded] = useState(false);

  const totalTopics = child.topicResults.length;
  const passedCount = child.topicResults.filter((t) => t.passed).length;
  const hasTopics = totalTopics > 0;

  return (
    <li className="rounded-2xl border border-white/10 bg-[#1a1a1a]">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0 truncate text-body-strong text-white">{child.username}</span>
        <div className="flex shrink-0 items-center gap-2">
          {hasTopics && <StatChip label="Topics" value={`${passedCount}/${totalTopics}`} />}
          <StatChip label="Missions" value={child.missionsCompleted} />
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={[
              "text-white/40 transition-transform",
              expanded ? "rotate-180" : "",
            ].join(" ")}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-4 py-3">
          {!hasTopics ? (
            <p className="text-[11px] text-white/40">No homework topics yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">
                Topics passed {passedCount}/{totalTopics}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {child.topicResults.map((topic) => (
                  <li
                    key={topic.topicId}
                    className={[
                      "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                      topic.passed
                        ? "bg-lime-green/15 text-lime-green"
                        : "bg-white/5 text-white/50",
                    ].join(" ")}
                  >
                    <span aria-hidden="true">{topic.passed ? "✓" : "○"}</span>
                    <span className="max-w-[9rem] truncate">{topic.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
