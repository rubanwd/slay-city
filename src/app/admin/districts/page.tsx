import AdminDistrictForm from "@/features/admin/AdminDistrictForm";
import AdminDistrictItem, { type AdminDistrictItemData } from "@/features/admin/AdminDistrictItem";
import AdminHeader from "@/features/admin/AdminHeader";
import { requireAdminPage } from "@/features/admin/guard";

/** Manage districts: view, add, and edit them. */
export default async function AdminDistrictsPage() {
  const { supabase } = await requireAdminPage();

  const [{ data: districts }, { data: locations }] = await Promise.all([
    supabase
      .from("districts")
      .select("id, name, description, order_index, is_published")
      .order("order_index"),
    supabase.from("locations").select("id, district_id"),
  ]);

  const districtRows: AdminDistrictItemData[] = districts ?? [];

  const locationCounts = new Map<string, number>();
  for (const loc of locations ?? []) {
    locationCounts.set(loc.district_id, (locationCounts.get(loc.district_id) ?? 0) + 1);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title="Districts" backHref="/admin" />

        <h2 className="mb-2 mt-2 text-label text-white/50">Districts ({districtRows.length})</h2>
        {districtRows.length === 0 ? (
          <p className="mb-6 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
            No districts yet. Create the first one below.
          </p>
        ) : (
          <ul className="mb-6 flex flex-col gap-3">
            {districtRows.map((d) => (
              <AdminDistrictItem key={d.id} district={d} locationCount={locationCounts.get(d.id) ?? 0} />
            ))}
          </ul>
        )}

        <AdminDistrictForm />
      </div>
    </main>
  );
}
