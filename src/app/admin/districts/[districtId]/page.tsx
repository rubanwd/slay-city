import { redirect } from "next/navigation";

import NavLink from "@/components/ui/NavLink";
import AdminCreateModal from "@/features/admin/AdminCreateModal";
import AdminDistrictHeader from "@/features/admin/AdminDistrictHeader";
import type { AdminDistrictItemData } from "@/features/admin/AdminDistrictList";
import AdminHeader from "@/features/admin/AdminHeader";
import AdminLocationForm from "@/features/admin/AdminLocationForm";
import AdminDistrictMapPreview from "@/features/admin/AdminDistrictMapPreview";
import AdminLocationItem, { type AdminLocationItemData } from "@/features/admin/AdminLocationItem";
import { requireAdminPage } from "@/features/admin/guard";
import { KNOWLEDGE_LEVEL_LABELS } from "@/features/levels/levels";

interface DistrictDetailPageProps {
  params: Promise<{ districtId: string }>;
}

/** A single district: edit it, view/add the locations inside it. */
export default async function DistrictDetailPage({ params }: DistrictDetailPageProps) {
  const { districtId } = await params;
  const { supabase } = await requireAdminPage();

  const { data: district } = await supabase
    .from("districts")
    .select("id, name, description, order_index, is_published, background_image_url, level")
    .eq("id", districtId)
    .maybeSingle();

  if (!district) {
    redirect("/admin/levels");
  }

  const [{ data: locations }, { data: missions }] = await Promise.all([
    supabase
      .from("locations")
      .select("id, district_id, name, description, order_index, is_published, map_x, map_y, icon_url")
      .eq("district_id", districtId)
      .order("order_index"),
    supabase.from("missions").select("id, location_id"),
  ]);

  const districtData: AdminDistrictItemData = district;
  const locationRows: AdminLocationItemData[] = locations ?? [];

  const missionCounts = new Map<string, number>();
  for (const m of missions ?? []) {
    missionCounts.set(m.location_id, (missionCounts.get(m.location_id) ?? 0) + 1);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title={district.name} backHref={`/admin/levels/${district.level}`} />

        <nav className="mb-3 flex items-center gap-1.5 text-xs text-white/40">
          <NavLink href="/admin/levels" className="hover:text-white/70">
            Levels
          </NavLink>
          <span>›</span>
          <NavLink href={`/admin/levels/${district.level}`} className="hover:text-white/70">
            {KNOWLEDGE_LEVEL_LABELS[district.level]}
          </NavLink>
          <span>›</span>
          <span className="truncate text-white/60">{district.name}</span>
        </nav>

        <AdminDistrictHeader
          district={districtData}
          locations={locationRows.map((loc) => ({ name: loc.name, description: loc.description }))}
        />

        <AdminDistrictMapPreview
          districtName={district.name}
          backgroundUrl={district.background_image_url}
          locations={locationRows.map((loc) => ({
            id: loc.id,
            name: loc.name,
            mapX: Number(loc.map_x ?? 50),
            mapY: Number(loc.map_y ?? 50),
            isPublished: loc.is_published,
          }))}
        />

        <h2 className="mb-2 text-label text-white/50">Locations ({locationRows.length})</h2>
        {locationRows.length === 0 ? (
          <p className="mb-6 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
            No locations yet. Create the first one below.
          </p>
        ) : (
          <ul className="mb-6 flex flex-col gap-3">
            {locationRows.map((loc) => (
              <AdminLocationItem
                key={loc.id}
                location={loc}
                missionCount={missionCounts.get(loc.id) ?? 0}
              />
            ))}
          </ul>
        )}

        <AdminCreateModal triggerLabel="Add Location" title="New Location">
          <AdminLocationForm
            fixedDistrictId={districtId}
            districtBackgroundUrl={district.background_image_url}
            districtName={district.name}
          />
        </AdminCreateModal>
      </div>
    </main>
  );
}
