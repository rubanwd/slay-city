import NavLink from "@/components/ui/NavLink";
import { redirect } from "next/navigation";

import AdminCreateModal from "@/features/admin/AdminCreateModal";
import AdminHeader from "@/features/admin/AdminHeader";
import AdminLocationHeader from "@/features/admin/AdminLocationHeader";
import type { AdminLocationItemData } from "@/features/admin/AdminLocationItem";
import AdminMissionForm from "@/features/admin/AdminMissionForm";
import AdminMissionItem, { type AdminMissionItemData } from "@/features/admin/AdminMissionItem";
import { requireAdminPage } from "@/features/admin/guard";
import { toLocationOptions } from "@/features/admin/locationOptions";
import { DEFAULT_KNOWLEDGE_LEVEL, knowledgeLevelLabel } from "@/features/levels/levels";
import { countImageSlots } from "@/features/admin/taskImageSlots";
import type { MissionTaskType } from "@/features/admin/taskTypes";
import type { Json } from "@/types/database";

interface LocationDetailPageProps {
  params: Promise<{ districtId: string; locationId: string }>;
}

/** A single location: edit it, view/add the missions at it. */
export default async function LocationDetailPage({ params }: LocationDetailPageProps) {
  const { districtId, locationId } = await params;
  const { supabase } = await requireAdminPage();

  const { data: location } = await supabase
    .from("locations")
    .select(
      "id, district_id, name, description, order_index, is_published, map_x, map_y, icon_url, districts(name, background_image_url, level)"
    )
    .eq("id", locationId)
    .maybeSingle();

  // Guard: location must exist and belong to the district in the URL.
  if (!location || location.district_id !== districtId) {
    redirect(`/admin/districts/${districtId}`);
  }

  const [{ data: missions }, { data: allLocations }] = await Promise.all([
    supabase
      .from("missions")
      .select(
        "id, title, description, order_index, xp_reward, coin_reward, is_published, location_id"
      )
      .eq("location_id", locationId)
      .order("order_index"),
    // Every location, so a mission can be moved elsewhere from its edit form.
    supabase.from("locations").select("id, name, districts(name)").order("order_index"),
  ]);

  const { districts, ...locationCols } = location;
  const locationData: AdminLocationItemData = locationCols;
  const missionRows: AdminMissionItemData[] = missions ?? [];
  const locationOptions = toLocationOptions(allLocations);

  // Per-mission image-slot counts, so each mission box can show its artwork
  // progress and offer bulk generation. One query for the whole location.
  const imageCountsByMission = new Map<string, { total: number; missing: number }>();
  if (missionRows.length > 0) {
    const { data: tasks } = await supabase
      .from("mission_tasks")
      .select("mission_id, task_type, content")
      .in(
        "mission_id",
        missionRows.map((m) => m.id)
      );
    const tasksByMission = new Map<string, { task_type: MissionTaskType; content: Json }[]>();
    for (const task of tasks ?? []) {
      const list = tasksByMission.get(task.mission_id) ?? [];
      list.push({ task_type: task.task_type as MissionTaskType, content: task.content });
      tasksByMission.set(task.mission_id, list);
    }
    for (const [missionId, list] of tasksByMission) {
      imageCountsByMission.set(missionId, countImageSlots(list));
    }
  }
  const districtName = districts?.name ?? "District";
  const districtBackgroundUrl = districts?.background_image_url ?? null;
  const districtLevel = districts?.level ?? DEFAULT_KNOWLEDGE_LEVEL;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title={location.name} backHref={`/admin/districts/${districtId}`} />

        <nav className="mb-3 flex items-center gap-1.5 text-xs text-white/40">
          <NavLink href={`/admin/levels/${districtLevel}`} className="hover:text-white/70">
            {knowledgeLevelLabel(districtLevel)}
          </NavLink>
          <span>›</span>
          <NavLink href={`/admin/districts/${districtId}`} className="hover:text-white/70">
            {districtName}
          </NavLink>
          <span>›</span>
          <span className="truncate text-white/60">{location.name}</span>
        </nav>

        <AdminLocationHeader
          location={locationData}
          districtBackgroundUrl={districtBackgroundUrl}
          districtName={districtName}
        />

        <h2 className="mb-2 text-label text-white/50">Missions ({missionRows.length})</h2>
        {missionRows.length === 0 ? (
          <p className="mb-6 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
            No missions yet. Create the first one below.
          </p>
        ) : (
          <ul className="mb-6 flex flex-col gap-2">
            {missionRows.map((m) => {
              const counts = imageCountsByMission.get(m.id);
              return (
                <AdminMissionItem
                  key={m.id}
                  mission={m}
                  locations={locationOptions}
                  imageTotal={counts?.total ?? 0}
                  imageMissing={counts?.missing ?? 0}
                />
              );
            })}
          </ul>
        )}

        <AdminCreateModal triggerLabel="Add Mission" title="New Mission">
          <AdminMissionForm locationId={locationId} nextOrder={missionRows.length} />
        </AdminCreateModal>
      </div>
    </main>
  );
}
