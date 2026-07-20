import { AdminToastProvider } from "@/features/admin/AdminToast";

/**
 * Homework CRUD forms under `/teacher/groups/*` reuse the same toast provider
 * as the admin console (`AdminToastProvider` is generic — nothing admin-only
 * about it) so `useAdminToast()` has an ancestor to report to.
 */
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <AdminToastProvider>{children}</AdminToastProvider>;
}
