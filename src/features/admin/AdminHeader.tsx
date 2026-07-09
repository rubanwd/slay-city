import Link from "next/link";

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
      <h1 className="text-h2 font-black text-white">{title}</h1>
      <span className="ml-auto shrink-0 rounded-full border border-lime-green/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-lime-green">
        Admin
      </span>
    </header>
  );
}
