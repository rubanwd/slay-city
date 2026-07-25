"use client";

import { useState, useTransition } from "react";

import { deleteFeedbackReport } from "./actions";
import { feedbackKindLabel } from "./feedback";
import type { FeedbackReportView } from "./queries";

/**
 * Fixed locale and timezone so the string the server renders matches the one the
 * browser hydrates with. The console is English-only and the team is spread
 * across timezones, so UTC is the honest reading.
 */
function formatSubmitted(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })} UTC`;
}

export interface AdminFeedbackItemProps {
  report: FeedbackReportView;
}

/** One report in the admin inbox: who sent it, what they wrote, and their screenshots. */
export default function AdminFeedbackItem({ report }: AdminFeedbackItemProps) {
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  if (deleted) return null;

  const isBug = report.kind === "bug";

  const remove = () => {
    if (!window.confirm("Delete this report? This can't be undone.")) return;
    setError(null);
    startDelete(async () => {
      const result = await deleteFeedbackReport(report.id);
      if (result.ok) {
        setDeleted(true);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <article
      className={`flex flex-col gap-3 rounded-2xl border bg-[#1a1a1a] p-4 ${
        report.isRead ? "border-white/10" : "border-cyan/40"
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
            isBug ? "bg-neon-pink/15 text-neon-pink" : "bg-lime-green/15 text-lime-green"
          }`}
        >
          {feedbackKindLabel(report.kind)}
        </span>
        {!report.isRead && (
          <span className="shrink-0 rounded-full bg-cyan px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-black">
            New
          </span>
        )}
        <button
          type="button"
          onClick={remove}
          disabled={isDeleting}
          aria-label="Delete report"
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/10 hover:text-neon-pink disabled:opacity-40"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      <p className="whitespace-pre-wrap break-words text-body text-white">{report.message}</p>

      {report.imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {report.imageUrls.map((url, index) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block h-24 w-24 overflow-hidden rounded-xl border border-white/15 transition-opacity hover:opacity-80"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Screenshot ${index + 1} from ${report.authorUsername ?? "a user"}`}
                className="h-full w-full object-cover"
              />
            </a>
          ))}
        </div>
      )}

      <p className="text-small text-white/40">
        {report.authorUsername ?? "Deleted user"}
        {report.authorRole && <span className="text-white/25"> · {report.authorRole}</span>}
        <span className="text-white/25"> · {formatSubmitted(report.createdAt)}</span>
      </p>

      {error && (
        <p role="alert" className="text-sm font-semibold text-neon-pink">
          {error}
        </p>
      )}
    </article>
  );
}
