import { exitViewAsTeacher } from "./viewAsActions";

export interface ViewAsTeacherBannerProps {
  /** The teacher whose console the admin is currently viewing. */
  username: string;
}

/**
 * Sticky banner shown across the teacher console while an admin is "viewing as"
 * a teacher. Makes the impersonation obvious and offers a one-tap way out.
 */
export default function ViewAsTeacherBanner({ username }: ViewAsTeacherBannerProps) {
  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-purple text-white">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 py-2.5">
        <p className="min-w-0 truncate text-small">
          <span className="font-black uppercase tracking-wide">Viewing as</span>{" "}
          <span className="font-bold">{username}</span>
        </p>
        <form action={exitViewAsTeacher} className="shrink-0">
          <button
            type="submit"
            className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-purple transition-colors hover:bg-white/90"
          >
            Exit View
          </button>
        </form>
      </div>
    </div>
  );
}
