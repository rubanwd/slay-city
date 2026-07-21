import { AdminToastProvider } from "@/features/admin/AdminToast";
import ViewAsTeacherBanner from "@/features/teacher/ViewAsTeacherBanner";
import { resolveTeacherContext } from "@/features/teacher/viewAs";
import { createClient } from "@/lib/supabase/server";

/**
 * Homework CRUD forms under `/teacher/groups/*` reuse the same toast provider
 * as the admin console (`AdminToastProvider` is generic — nothing admin-only
 * about it) so `useAdminToast()` has an ancestor to report to.
 *
 * When an admin is "viewing as" a teacher, a sticky banner across the whole
 * console makes the impersonation obvious and offers a way out. The per-page
 * guard still does the real access check; this only decides whether to show the
 * banner.
 */
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const context = await resolveTeacherContext(supabase);

  return (
    <AdminToastProvider>
      {context?.viewingAs && <ViewAsTeacherBanner username={context.viewingAs.username} />}
      {children}
    </AdminToastProvider>
  );
}
