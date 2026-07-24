import { notFound } from "next/navigation";

import AdminCreateModal from "@/features/admin/AdminCreateModal";
import AdminDistrictForm from "@/features/admin/AdminDistrictForm";
import AdminDistrictList, {
  type AdminDistrictItemData,
} from "@/features/admin/AdminDistrictList";
import AdminHeader from "@/features/admin/AdminHeader";
import { requireAdminPage } from "@/features/admin/guard";
import { isKnowledgeLevel, KNOWLEDGE_LEVEL_LABELS } from "@/features/levels/levels";

interface LevelDetailPageProps {
  params: Promise<{ level: string }>;
}

/** The districts of one knowledge level: view, reorder, add, and edit them. */
export default async function AdminLevelDetailPage({ params }: LevelDetailPageProps) {
  const { level } = await params;
  if (!isKnowledgeLevel(level)) {
    notFound();
  }

  const { supabase } = await requireAdminPage();

  const [{ data: districts }, { data: locations }] = await Promise.all([
    supabase
      .from("districts")
      .select("id, name, description, order_index, is_published, background_image_url, level")
      .eq("level", level)
      .order("order_index"),
    supabase.from("locations").select("id, district_id"),
  ]);

  const districtRows: AdminDistrictItemData[] = districts ?? [];

  // Plain object, not a Map — it crosses into a client component.
  const locationCounts: Record<string, number> = {};
  for (const loc of locations ?? []) {
    locationCounts[loc.district_id] = (locationCounts[loc.district_id] ?? 0) + 1;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title={KNOWLEDGE_LEVEL_LABELS[level]} backHref="/admin/levels" />

        <nav className="mb-3 flex items-center gap-1.5 text-xs text-white/40">
          <span className="text-white/40">Levels</span>
          <span>›</span>
          <span className="truncate text-white/60">{KNOWLEDGE_LEVEL_LABELS[level]}</span>
        </nav>

        <h2 className="mb-2 text-label text-white/50">Districts ({districtRows.length})</h2>
        {districtRows.length === 0 ? (
          <p className="mb-6 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
            No districts in this level yet. Create the first one below.
          </p>
        ) : (
          <AdminDistrictList districts={districtRows} locationCounts={locationCounts} />
        )}

        <AdminCreateModal
          triggerLabel="Add District"
          title={`New ${KNOWLEDGE_LEVEL_LABELS[level]} District`}
        >
          <AdminDistrictForm fixedLevel={level} />
        </AdminCreateModal>
      </div>
    </main>
  );
}
