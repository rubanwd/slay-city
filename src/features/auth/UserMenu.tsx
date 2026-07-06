"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { resetMissionProgress } from "@/features/mission/actions";

import { signOut } from "./actions";

/** The three-dot "more" affordance shown in the top-right corner. */
function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

function LogoutMenuItem() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      role="menuitem"
      disabled={pending}
      className={[
        "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold",
        "text-neon-pink hover:bg-white/10 active:bg-white/5",
        "disabled:opacity-50 disabled:pointer-events-none transition-colors",
      ].join(" ")}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      {pending ? "Logging out…" : "Log Out"}
    </button>
  );
}

/**
 * TEMPORARY dev/test menu item — wipes the current user's mission progress and
 * stats so content can be replayed. Exposed to everyone for now; before launch
 * this should be shown to admins only (or removed). See {@link resetMissionProgress}.
 */
function ResetProgressMenuItem() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      role="menuitem"
      disabled={pending}
      className={[
        "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold",
        "text-amber-400 hover:bg-white/10 active:bg-white/5",
        "disabled:opacity-50 disabled:pointer-events-none transition-colors",
      ].join(" ")}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
      {pending ? "Resetting…" : "Reset Progress (dev)"}
    </button>
  );
}

/**
 * Account menu: a compact icon button in the corner that opens a dropdown.
 * Holds Log Out plus a temporary dev-only "Reset Progress" action; add more
 * `role="menuitem"` entries to the panel as the app grows (settings, profile).
 */
export default function UserMenu({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Open menu"
        className={[
          "flex h-10 w-10 items-center justify-center rounded-full",
          "bg-white/10 text-white hover:bg-white/20 active:bg-white/5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          "transition-colors",
        ].join(" ")}
      >
        <MenuIcon />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className={[
            "absolute right-0 top-12 z-50 min-w-44 overflow-hidden rounded-xl",
            "border border-white/10 bg-zinc-900 shadow-xl shadow-black/50",
          ].join(" ")}
        >
          {/* TEMPORARY: dev-only progress reset. Remove or gate to admins before launch. */}
          <form
            action={async () => {
              const result = await resetMissionProgress();
              if (!result.ok) {
                window.alert(result.error);
              }
              setOpen(false);
            }}
            onSubmit={(event) => {
              if (!window.confirm("Wipe all your mission progress, XP, coins, and streaks? This can't be undone.")) {
                event.preventDefault();
              }
            }}
          >
            <ResetProgressMenuItem />
          </form>

          <div className="border-t border-white/10" role="separator" />

          <form action={signOut}>
            <LogoutMenuItem />
          </form>
        </div>
      )}
    </div>
  );
}
