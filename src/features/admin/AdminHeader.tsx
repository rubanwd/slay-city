import NavLink from "@/components/ui/NavLink";

import AdminSidebar from "@/features/admin/AdminSidebar";
import { signOut } from "@/features/auth/actions";
import { getUnreadFeedbackCount } from "@/features/feedback/queries";
import { createClient } from "@/lib/supabase/server";

export interface AdminHeaderProps {
  title: string;
  /** When set, renders a back arrow linking here. */
  backHref?: string;
}

/**
 * Header shown on every admin screen. Reads the unread feedback count here
 * rather than in each page, so the marker on the menu's Feedback & Bugs entry
 * is visible from wherever the admin happens to be.
 */
export default async function AdminHeader({ title, backHref }: AdminHeaderProps) {
  const supabase = await createClient();
  const unreadFeedback = await getUnreadFeedbackCount(supabase);

  return (
    <header className="flex items-center gap-3 py-5">
      <AdminSidebar unreadFeedback={unreadFeedback} />
      {backHref && (
        <NavLink
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
        </NavLink>
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
