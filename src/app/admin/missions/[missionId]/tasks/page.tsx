import { redirect } from "next/navigation";

import AdminCreateModal from "@/features/admin/AdminCreateModal";
import AdminHeader from "@/features/admin/AdminHeader";
import AdminTaskForm from "@/features/admin/AdminTaskForm";
import AdminTaskItem from "@/features/admin/AdminTaskItem";
import { requireAdminPage } from "@/features/admin/guard";

interface MissionTasksPageProps {
  params: Promise<{ missionId: string }>;
}

/** Manage the tasks that make up a single mission (add, publish, unpublish). */
export default async function MissionTasksPage({ params }: MissionTasksPageProps) {
  const { missionId } = await params;
  const { supabase } = await requireAdminPage();

  const { data: mission } = await supabase
    .from("missions")
    .select("id, title, is_published, location_id")
    .eq("id", missionId)
    .maybeSingle();

  if (!mission) {
    redirect("/admin/missions");
  }

  const { data: location } = await supabase
    .from("locations")
    .select("district_id")
    .eq("id", mission.location_id)
    .maybeSingle();

  const backHref = location
    ? `/admin/districts/${location.district_id}/locations/${mission.location_id}`
    : "/admin/missions";

  const { data: tasks } = await supabase
    .from("mission_tasks")
    .select("id, task_type, order_index, content, is_published")
    .eq("mission_id", missionId)
    .order("order_index");

  const rows = tasks ?? [];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title="Mission Tasks" backHref={backHref} />

        <div className="mb-4 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3">
          <p className="text-small text-white/50">Mission</p>
          <p className="text-body-strong text-white">{mission.title}</p>
        </div>

        {/* ── Existing tasks ─────────────────────────────────────────────── */}
        <h2 className="mb-2 text-label text-white/50">Tasks ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className="mb-6 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
            No tasks yet. Add the first one below.
          </p>
        ) : (
          <ul className="mb-6 flex flex-col gap-2">
            {rows.map((task) => (
              <AdminTaskItem key={task.id} missionId={missionId} task={task} />
            ))}
          </ul>
        )}

        {/* ── Add task ───────────────────────────────────────────────────── */}
        <AdminCreateModal triggerLabel="Add Task" title="Add Task">
          <AdminTaskForm missionId={missionId} nextOrder={rows.length} />
        </AdminCreateModal>
      </div>
    </main>
  );
}
