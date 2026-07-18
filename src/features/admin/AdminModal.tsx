"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface AdminModalControls {
  close: () => void;
}

const AdminModalContext = createContext<AdminModalControls | null>(null);

/**
 * Lets a form rendered inside {@link AdminModal} close the modal after a
 * successful submit or on cancel. Returns `null` when not inside a modal, so
 * the same form component can be reused standalone.
 */
export function useAdminModalControls(): AdminModalControls | null {
  return useContext(AdminModalContext);
}

export interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Generic centered modal for admin "add" forms — dark panel, backdrop, Escape/click-outside to close. */
export default function AdminModal({ open, onClose, title, children }: AdminModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus is moved only when the modal opens. Keeping `onClose` out of the deps
  // matters: a parent that re-renders on every keystroke passes a fresh handler
  // each time, and re-running this would yank focus out of the field being typed
  // into. The panel check lets a child `autoFocus` its own input and keep it.
  useEffect(() => {
    if (!open) return;
    if (panelRef.current?.contains(document.activeElement)) return;
    closeBtnRef.current?.focus();
  }, [open]);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 py-10 backdrop-blur-sm"
    >
      <div
        ref={panelRef}
        className="flex max-h-full w-full max-w-md flex-col overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1a1a] p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-h3 font-bold text-white">{title}</h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <AdminModalContext.Provider value={{ close: onClose }}>{children}</AdminModalContext.Provider>
      </div>
    </div>,
    document.body
  );
}
