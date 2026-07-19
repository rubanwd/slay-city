"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import NavLink from "@/components/ui/NavLink";

type SidebarItem = {
  href: string;
  title: string;
  accent: string;
};

/**
 * Main admin sections, mirroring the Content Manager landing cards. Kept in sync
 * with the cards in {@link file://./../../app/admin/page.tsx} so the sidebar is a
 * complete shortcut list to every top-level admin area.
 */
const ITEMS: SidebarItem[] = [
  { href: "/admin/districts", title: "Districts, Locations, Missions", accent: "text-cyan" },
  { href: "/admin/task-types", title: "Task Types", accent: "text-lime-green" },
  { href: "/admin/wardrobe", title: "Wardrobe", accent: "text-neon-pink" },
  { href: "/admin/admins", title: "Manage Admins", accent: "text-purple" },
];

/**
 * Hamburger button + slide-out left drawer for jumping between the main admin
 * sections. Lives in {@link file://./AdminHeader.tsx} so it's reachable from
 * every admin screen, not just the Content Manager landing. Closes on backdrop
 * click, Escape, or after navigating.
 */
export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  // Separate flag drives the slide/fade transition: we mount off-screen, then
  // flip `shown` on the next frame so the browser animates the entrance.
  const [shown, setShown] = useState(false);
  const pathname = usePathname();

  // Reset `shown` here (not in an effect) so the next open animates from
  // off-screen again; the portal unmounts on close, so there's no exit tween.
  const close = () => {
    setOpen(false);
    setShown(false);
  };

  // Reveal after mount for the slide-in entrance.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:bg-white/5 hover:text-white"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M3 12h18" />
          <path d="M3 18h18" />
        </svg>
      </button>

      {open &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin sections"
            onClick={handleBackdrop}
            className={`fixed inset-0 z-50 bg-black/70 transition-opacity duration-200 ${
              shown ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className={`flex h-full w-[85%] max-w-xs flex-col overflow-y-auto border-r border-white/10 bg-[#111] p-5 shadow-2xl transition-transform duration-200 ease-out ${
                shown ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-label uppercase tracking-widest text-white/50">Sections</span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
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

              <nav className="flex flex-col gap-1">
                {ITEMS.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={close}
                      className={`rounded-xl px-4 py-3 text-body-strong font-bold transition-colors ${
                        item.accent
                      } ${active ? "bg-white/10" : "hover:bg-white/5"}`}
                    >
                      {item.title}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
