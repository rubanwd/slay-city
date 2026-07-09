import Link from "next/link";

import { signOut } from "@/features/auth/actions";

export interface AdminHeaderProps {
  title: string;
  /** When set, renders a back arrow linking here. */
  backHref?: string;
}

export default function AdminHeader({ title, backHref }: AdminHeaderProps) {
  return (
    <header className="flex items-center gap-3 py-5">
      {backHref && (
        <Link
          href={backHref}
          aria-label="Back"
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
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
      )}
      <h1 className="min-w-0 truncate text-h2 font-black text-white">{title}</h1>
      <span className="ml-auto shrink-0 rounded-full border border-lime-green/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-lime-green">
        Admin
      </span>
      <form action={signOut}>
        <button
          type="submit"
          aria-label="Log out"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neon-pink/40 text-neon-pink transition-colors hover:bg-neon-pink/10"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </form>
    </header>
  );
}
