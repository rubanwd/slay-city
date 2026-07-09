import AdminDistrictItem, { type AdminDistrictItemData } from "@/features/admin/AdminDistrictItem";
import AdminHeader from "@/features/admin/AdminHeader";
import type { AdminLocationItemData } from "@/features/admin/AdminLocationItem";
import type { AdminMissionItemData } from "@/features/admin/AdminMissionItem";
import AdminTaxonomyForms, { type DistrictOption } from "@/features/admin/AdminTaxonomyForms";
import { requireAdminPage } from "@/features/admin/guard";

/** Manage districts and locations, view/add/edit the missions within each location. */
export default async function NewDistrictLocationPage() {
  const { supabase } = await requireAdminPage();

  const [{ data: districts }, { data: locations }, { data: missions }] = await Promise.all([
    supabase
      .from("districts")
      .select("id, name, description, order_index, is_published")
      .order("order_index"),
    supabase
      .from("locations")
      .select("id, district_id, name, description, order_index, is_published, map_x, map_y")
      .order("order_index"),
    supabase
      .from("missions")
      .select("id, title, description, xp_reward, coin_reward, is_published, location_id"),
  ]);

  const districtRows: AdminDistrictItemData[] = districts ?? [];
  const locationRows: AdminLocationItemData[] = locations ?? [];
  const missionRows: AdminMissionItemData[] = missions ?? [];

  const locationsByDistrict = new Map<string, AdminLocationItemData[]>();
  for (const loc of locationRows) {
    const list = locationsByDistrict.get(loc.district_id) ?? [];
    list.push(loc);
    locationsByDistrict.set(loc.district_id, list);
  }

  const missionsByLocation: Record<string, AdminMissionItemData[]> = {};
  for (const m of missionRows) {
    const list = missionsByLocation[m.location_id] ?? [];
    list.push(m);
    missionsByLocation[m.location_id] = list;
  }

  const districtOptions: DistrictOption[] = districtRows.map((d) => ({ id: d.id, name: d.name }));

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title="Districts & Locations" backHref="/admin" />

        <h2 className="mb-2 mt-2 text-label text-white/50">Districts ({districtRows.length})</h2>
        {districtRows.length === 0 ? (
          <p className="mb-6 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
            No districts yet. Create the first one below.
          </p>
        ) : (
          <ul className="mb-6 flex flex-col gap-3">
            {districtRows.map((d) => (
              <AdminDistrictItem
                key={d.id}
                district={d}
                locations={locationsByDistrict.get(d.id) ?? []}
                missionsByLocation={missionsByLocation}
              />
            ))}
          </ul>
        )}

        <AdminTaxonomyForms districts={districtOptions} />
      </div>
    </main>
  );
}
