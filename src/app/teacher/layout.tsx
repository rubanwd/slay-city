import { AdminToastProvider } from "@/features/admin/AdminToast";
import ViewAsTeacherBanner, { VIEW_AS_BANNER_OFFSET } from "@/features/teacher/ViewAsTeacherBanner";
import { resolveTeacherContext } from "@/features/teacher/viewAs";
import { createClient } from "@/lib/supabase/server";

/**
 * Homework CRUD forms under `/teacher/groups/*` reuse the same toast provider
 * as the admin console (`AdminToastProvider` is generic — nothing admin-only
 * about it) so `useAdminToast()` has an ancestor to report to.
 *
 * When an admin is "viewing as" a teacher, a banner across the whole console
 * makes the impersonation obvious and offers a way out. The per-page guard
 * still does the real access check; this only decides whether to show the
 * banner.
 *
 * The banner sits above the console's screens, so the wrapper also declares its
 * height (`VIEW_AS_BANNER_OFFSET`) for the `ScrollScreen`s below to subtract
 * from their own — without that they run a banner's worth past the bottom of
 * the viewport and the fixed nav covers the end of the content.
 */
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const context = await resolveTeacherContext(supabase);

  if (context?.viewingAs) {
    return (
      <AdminToastProvider>
        <div className={`contents ${VIEW_AS_BANNER_OFFSET}`}>
          <ViewAsTeacherBanner username={context.viewingAs.username} />
          {children}
        </div>
      </AdminToastProvider>
    );
  }

  return <AdminToastProvider>{children}</AdminToastProvider>;
}
