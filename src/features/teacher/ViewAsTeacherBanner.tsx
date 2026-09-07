import { exitViewAsTeacher } from "./viewAsActions";

export interface ViewAsTeacherBannerProps {
  /** The teacher whose username the admin is currently viewing the console as. */
  username: string;
}

/**
 * How much vertical space the banner takes from the screens below it.
 *
 * The console's screens are `ScrollScreen`s pinned to the viewport, so a banner
 * stacked above one has to be subtracted from that screen's height — otherwise
 * the bottom of its scroll area sits below the fold and the fixed `BottomNav`
 * eats the last rows of content, which is exactly what happened here. The
 * layout hands this class to `ScrollScreen` through `--screen-top-offset`; the
 * height below is fixed (rather than left to the padding) so the two can't
 * drift apart, and the label truncates instead of wrapping to a second line.
 */
export const VIEW_AS_BANNER_OFFSET = "[--screen-top-offset:49px]";

/**
 * Sticky banner shown across the teacher console while an admin is "viewing as"
 * a teacher. Makes the impersonation obvious and offers a one-tap way out.
 * Sticky keeps it in view on the document-scrolling pages (the group and topic
 * editors); on a `ScrollScreen` it sits above the scroll area anyway.
 */
export default function ViewAsTeacherBanner({ username }: ViewAsTeacherBannerProps) {
  return (
    <div className="sticky top-0 z-50 h-[49px] border-b border-white/10 bg-purple text-white">
      <div className="mx-auto flex h-full w-full max-w-md items-center justify-between gap-3 px-5">
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
