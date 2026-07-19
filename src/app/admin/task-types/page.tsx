import NavLink from "@/components/ui/NavLink";

import AdminHeader from "@/features/admin/AdminHeader";
import { publishTaskType, unpublishTaskType } from "@/features/admin/actions";
import { requireAdminPage } from "@/features/admin/guard";
import { TASK_TYPES, taskTypeLabel } from "@/features/admin/taskTypes";
import { taskTypeInstructions } from "@/features/mission/types";

/**
 * Task Types catalog at `/admin/task-types`. Lists every task type with its
 * publish state; only published types can be picked when authoring mission tasks.
 * Each row links to a detail page for configuring and testing that type.
 */
export default async function TaskTypesPage() {
  const { supabase } = await requireAdminPage();

  const { data: templates } = await supabase
    .from("task_type_templates")
    .select("task_type, is_published");

  const publishedByType = new Map(
    (templates ?? []).map((row) => [row.task_type, row.is_published])
  );
  const publishedCount = (templates ?? []).filter((row) => row.is_published).length;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title="Task Types" backHref="/admin" />

        <p className="mb-4 text-small text-white/50">
          Configure and test each task type. Only published types appear in the mission
          task-type dropdown. {publishedCount}/{TASK_TYPES.length} published.
        </p>

        <ul className="flex flex-col gap-2">
          {TASK_TYPES.map((taskType) => {
            const isPublished = publishedByType.get(taskType) ?? false;
            return (
              <li
                key={taskType}
                className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <NavLink
                    href={`/admin/task-types/${taskType}`}
                    className="flex min-w-0 flex-1 flex-col"
                  >
                    <span className="flex items-center gap-2">
                      <span className="truncate text-body-strong text-white">
                        {taskTypeLabel(taskType)}
                      </span>
                      <span
                        className={[
                          "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                          isPublished ? "bg-lime-green/20 text-lime-green" : "bg-cyan/20 text-cyan",
                        ].join(" ")}
                      >
                        {isPublished ? "Published" : "Draft"}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-small text-white/50">
                      {taskTypeInstructions(taskType) || "No description yet."}
                    </span>
                  </NavLink>
                  <form action={isPublished ? unpublishTaskType : publishTaskType}>
                    <input type="hidden" name="task_type" value={taskType} />
                    <button
                      type="submit"
                      className={[
                        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
                        isPublished
                          ? "border-white/20 text-white/60 hover:bg-white/10"
                          : "border-lime-green/50 text-lime-green hover:bg-lime-green/10",
                      ].join(" ")}
                    >
                      {isPublished ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
