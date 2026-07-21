"use client";

import { useState, type ReactNode } from "react";

export interface CollapsibleSectionProps {
  title: string;
  /** Optional one-line description shown under the title, like Vocabulary Learning. */
  subtitle?: string;
  /** Whether the section starts open. Defaults to collapsed. */
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * A titled section on the teacher's topic page, styled like the Vocabulary
 * Learning card (purple-bordered panel) and collapsible by clicking its title.
 * Collapsed by default so the page opens compact and the teacher expands only
 * the section they want to work in.
 */
export default function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="mb-6 rounded-2xl border border-purple/30 bg-purple/5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="min-w-0">
          <span className="block text-body-strong text-white">{title}</span>
          {subtitle && <span className="mt-0.5 block text-small text-white/50">{subtitle}</span>}
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className={`shrink-0 text-white/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="flex flex-col gap-4 px-4 pb-4">{children}</div>}
    </section>
  );
}
