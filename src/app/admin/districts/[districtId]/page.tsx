import { redirect } from "next/navigation";

import AdminDistrictHeader from "@/features/admin/AdminDistrictHeader";
import type { AdminDistrictItemData } from "@/features/admin/AdminDistrictItem";
import AdminHeader from "@/features/admin/AdminHeader";
import AdminLocationForm from "@/features/admin/AdminLocationForm";
import AdminLocationItem, { type AdminLocationItemData } from "@/features/admin/AdminLocationItem";
import { requireAdminPage } from "@/features/admin/guard";

interface DistrictDetailPageProps {
  params: Promise<{ districtId: string }>;
}

/** A single district: edit it, view/add the locations inside it. */
export default async function DistrictDetailPage({ params }: DistrictDetailPageProps) {
  const { districtId } = await params;
  const { supabase } = await requireAdminPage();

  const { data: district } = await supabase
    .from("districts")
    .select("id, name, description, order_index, is_published")
    .eq("id", districtId)
    .maybeSingle();

  if (!district) {
    redirect("/admin/districts");
  }

  const [{ data: locations }, { data: missions }] = await Promise.all([
    supabase
      .from("locations")
      .select("id, district_id, name, description, order_index, is_published, map_x, map_y")
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
        <AdminHeader title={district.name} backHref="/admin/districts" />

        <AdminDistrictHeader district={districtData} />

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

        <AdminLocationForm fixedDistrictId={districtId} />
      </div>
    </main>
  );
}
