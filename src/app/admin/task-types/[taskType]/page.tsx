import { redirect } from "next/navigation";

import AdminHeader from "@/features/admin/AdminHeader";
import AdminTaskTypeConfigurator from "@/features/admin/AdminTaskTypeConfigurator";
import { publishTaskType, unpublishTaskType } from "@/features/admin/actions";
import { requireAdminPage } from "@/features/admin/guard";
import { TASK_TYPES, taskTypeLabel, type MissionTaskType } from "@/features/admin/taskTypes";
import { taskTypeInstructions } from "@/features/mission/types";

interface TaskTypePageProps {
  params: Promise<{ taskType: string }>;
}

function isTaskType(value: string): value is MissionTaskType {
  return (TASK_TYPES as string[]).includes(value);
}

/**
 * Configure a single task type: edit its example content, publish/unpublish it,
 * and test-run the task with the current content.
 */
export default async function TaskTypePage({ params }: TaskTypePageProps) {
  const { taskType } = await params;
  if (!isTaskType(taskType)) {
    redirect("/admin/task-types");
  }

  const { supabase } = await requireAdminPage();

  const { data: template } = await supabase
    .from("task_type_templates")
    .select("content, is_published")
    .eq("task_type", taskType)
    .maybeSingle();

  const content = template?.content ?? {};
  const isPublished = template?.is_published ?? false;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title={taskTypeLabel(taskType)} backHref="/admin/task-types" />

        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                  isPublished ? "bg-lime-green/20 text-lime-green" : "bg-cyan/20 text-cyan",
                ].join(" ")}
              >
                {isPublished ? "Published" : "Draft"}
              </span>
              <span className="text-small text-white/50">
                {isPublished ? "Available in missions" : "Hidden from missions"}
              </span>
            </div>
            {taskTypeInstructions(taskType) && (
              <p className="mt-1.5 text-small text-white/50">{taskTypeInstructions(taskType)}</p>
            )}
          </div>
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

        <AdminTaskTypeConfigurator taskType={taskType} initialContent={content} />
      </div>
    </main>
  );
}
