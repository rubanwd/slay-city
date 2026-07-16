"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type ToastKind = "success" | "error";

interface ToastEntry {
  id: number;
  kind: ToastKind;
  message: string;
}

interface AdminToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

/** Mounted once in the admin layout; renders a toast stack for every admin form to report to. */
export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  const success = useCallback((message: string) => push("success", message), [push]);
  const error = useCallback((message: string) => push("error", message), [push]);
  const value = useMemo(() => ({ success, error }), [success, error]);

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-5"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={[
              "pointer-events-auto w-full max-w-md rounded-xl border px-4 py-3 text-small font-semibold shadow-lg",
              "bg-[#1a1a1a]/95 backdrop-blur",
              t.kind === "success"
                ? "border-lime-green/50 text-lime-green"
                : "border-neon-pink/50 text-neon-pink",
            ].join(" ")}
          >
            {t.message}
          </div>
        ))}
      </div>
    </AdminToastContext.Provider>
  );
}

/** Fires a toast from any admin form. Requires {@link AdminToastProvider} as an ancestor. */
export function useAdminToast(): AdminToastContextValue {
  const ctx = useContext(AdminToastContext);
  if (!ctx) throw new Error("useAdminToast must be used within AdminToastProvider");
  return ctx;
}
