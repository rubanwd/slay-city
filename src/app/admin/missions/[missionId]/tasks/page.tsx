import { redirect } from "next/navigation";

import AdminHeader from "@/features/admin/AdminHeader";
import AdminTaskForm from "@/features/admin/AdminTaskForm";
import { publishMissionTask, unpublishMissionTask } from "@/features/admin/actions";
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
    .select("id, title, is_published")
    .eq("id", missionId)
    .maybeSingle();

  if (!mission) {
    redirect("/admin/missions");
  }

  const { data: tasks } = await supabase
    .from("mission_tasks")
    .select("id, task_type, order_index, content, is_published")
    .eq("mission_id", missionId)
    .order("order_index");

  const rows = tasks ?? [];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title="Mission Tasks" backHref="/admin/missions" />

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
              <li
                key={task.id}
                className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white/70">
                      {task.order_index}
                    </span>
                    <span className="truncate text-body-strong capitalize text-white">
                      {task.task_type}
                    </span>
                    <span
                      className={[
                        "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                        task.is_published
                          ? "bg-lime-green/20 text-lime-green"
                          : "bg-cyan/20 text-cyan",
                      ].join(" ")}
                    >
                      {task.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <form
                    action={task.is_published ? unpublishMissionTask : publishMissionTask}
                    className="shrink-0"
                  >
                    <input type="hidden" name="id" value={task.id} />
                    <input type="hidden" name="mission_id" value={missionId} />
                    <button
                      type="submit"
                      className={[
                        "rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
                        task.is_published
                          ? "border-white/20 text-white/60 hover:bg-white/10"
                          : "border-lime-green/50 text-lime-green hover:bg-lime-green/10",
                      ].join(" ")}
                    >
                      {task.is_published ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                </div>
                <pre className="mt-2 max-h-24 overflow-auto rounded-lg bg-black/40 px-3 py-2 text-xs text-white/50">
                  {JSON.stringify(task.content)}
                </pre>
              </li>
            ))}
          </ul>
        )}

        {/* ── Add task ───────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5">
          <h2 className="mb-4 text-h3 font-bold text-white">Add Task</h2>
          <AdminTaskForm missionId={missionId} nextOrder={rows.length} />
        </section>
      </div>
    </main>
  );
}
