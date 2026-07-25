import AdminHeader from "@/features/admin/AdminHeader";
import { requireAdminPage } from "@/features/admin/guard";
import AdminFeedbackItem from "@/features/feedback/AdminFeedbackItem";
import MarkFeedbackRead from "@/features/feedback/MarkFeedbackRead";
import { listFeedbackReports } from "@/features/feedback/queries";

/**
 * The admin inbox at `/admin/feedback` — every bug report and piece of feedback
 * students and teachers sent from their profile, newest first. Opening the page
 * marks them read for this admin, which clears the badge in the console menu.
 */
export default async function AdminFeedbackPage() {
  const { supabase } = await requireAdminPage();
  const reports = await listFeedbackReports(supabase);
  const unreadCount = reports.filter((report) => !report.isRead).length;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title="Feedback & Bugs" backHref="/admin" />

        <p className="mb-4 text-small text-white/50">
          {reports.length === 0
            ? "Reports from students and teachers land here."
            : `${reports.length} report${reports.length === 1 ? "" : "s"}${
                unreadCount > 0 ? ` · ${unreadCount} new` : ""
              }`}
        </p>

        {reports.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 text-center">
            <p className="text-body-strong text-white/70">Nothing reported yet.</p>
            <p className="mt-1 text-small text-white/40">
              Students and teachers can send one from their profile screen.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((report) => (
              <AdminFeedbackItem key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>

      <MarkFeedbackRead />
    </main>
  );
}
