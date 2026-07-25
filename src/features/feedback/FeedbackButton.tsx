"use client";

import { useEffect, useState, useTransition, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import { SlayButton } from "@/components/ui";

import { submitFeedbackReport } from "./actions";
import FeedbackImagePicker from "./FeedbackImagePicker";
import {
  FEEDBACK_KINDS,
  MAX_MESSAGE_LENGTH,
  feedbackKindLabel,
  type FeedbackKind,
} from "./feedback";

const PLACEHOLDER: Record<FeedbackKind, string> = {
  bug: "What went wrong? Where were you when it happened?",
  feedback: "What would make SLAY CITY better?",
};

/**
 * The Feedback & Bugs entry point on the profile screen, for students and
 * teachers. Opens a sheet where they describe the problem and attach
 * screenshots; the report lands in the admin console's inbox.
 */
export default function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold",
          "border border-cyan/40 text-cyan hover:bg-cyan/10 active:bg-cyan/5 transition-colors",
        ].join(" ")}
      >
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
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M12 7v5" />
          <path d="M12 15h.01" />
        </svg>
        Feedback &amp; Bugs
      </button>

      {/* Mounted only while open, so every visit starts from a blank draft. */}
      {open && <FeedbackDialog onClose={() => setOpen(false)} />}
    </>
  );
}

interface FeedbackDialogProps {
  onClose: () => void;
}

/**
 * The report sheet itself. Kept in this file because it exists only for
 * {@link FeedbackButton} — it holds the draft, uploads screenshots through
 * {@link FeedbackImagePicker}, and shows a thank-you state after a successful
 * send instead of dumping the user straight back to the profile.
 */
function FeedbackDialog({ onClose }: FeedbackDialogProps) {
  const [kind, setKind] = useState<FeedbackKind>("bug");
  const [message, setMessage] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isSending, startSend] = useTransition();

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof window === "undefined") return null;

  const handleBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const send = () => {
    setError(null);
    startSend(async () => {
      const result = await submitFeedbackReport({ kind, message, imageUrls });
      if (result.ok) {
        setSent(true);
      } else {
        setError(result.error);
      }
    });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Feedback and bugs"
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:px-5 sm:py-10"
    >
      <div className="flex max-h-full w-full max-w-md flex-col overflow-y-auto rounded-t-3xl border border-white/10 bg-[#1a1a1a] p-5 pb-8 sm:rounded-3xl sm:pb-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-white">Feedback &amp; Bugs</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M2 2l12 12M14 2L2 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="text-4xl" aria-hidden="true">
              💚
            </span>
            <p className="text-base font-bold text-white">Thanks — we got it!</p>
            <p className="text-sm text-white/60">
              Your report is on its way to the team. We read every one.
            </p>
            <SlayButton variant="green" size="md" onClick={onClose} className="w-full">
              Done
            </SlayButton>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2" role="group" aria-label="Report type">
              {FEEDBACK_KINDS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setKind(option)}
                  aria-pressed={kind === option}
                  className={[
                    "flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors",
                    kind === option
                      ? "bg-neon-pink text-white"
                      : "border border-white/20 text-white/60 hover:bg-white/5",
                  ].join(" ")}
                >
                  {feedbackKindLabel(option)}
                </button>
              ))}
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                What happened?
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                rows={5}
                placeholder={PLACEHOLDER[kind]}
                className="w-full resize-y rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-cyan focus:outline-none"
              />
              <span className="self-end text-[11px] text-white/30">
                {message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </label>

            <FeedbackImagePicker value={imageUrls} onChange={setImageUrls} disabled={isSending} />

            {error && (
              <p role="alert" className="text-sm font-semibold text-neon-pink">
                {error}
              </p>
            )}

            <SlayButton
              variant="pink"
              size="md"
              onClick={send}
              loading={isSending}
              disabled={!message.trim()}
              className="w-full"
            >
              Send report
            </SlayButton>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
