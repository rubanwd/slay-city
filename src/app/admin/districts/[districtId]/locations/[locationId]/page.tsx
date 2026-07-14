import Link from "next/link";
import { redirect } from "next/navigation";

import AdminHeader from "@/features/admin/AdminHeader";
import AdminLocationHeader from "@/features/admin/AdminLocationHeader";
import type { AdminLocationItemData } from "@/features/admin/AdminLocationItem";
import AdminMissionForm from "@/features/admin/AdminMissionForm";
import AdminMissionItem, { type AdminMissionItemData } from "@/features/admin/AdminMissionItem";
import { requireAdminPage } from "@/features/admin/guard";

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
      "id, district_id, name, description, order_index, is_published, map_x, map_y, icon_url, districts(name, background_image_url)"
    )
    .eq("id", locationId)
    .maybeSingle();

  // Guard: location must exist and belong to the district in the URL.
  if (!location || location.district_id !== districtId) {
    redirect(`/admin/districts/${districtId}`);
  }

  const { data: missions } = await supabase
    .from("missions")
    .select("id, title, description, order_index, xp_reward, coin_reward, is_published, location_id")
    .eq("location_id", locationId)
    .order("order_index");

  const { districts, ...locationCols } = location;
  const locationData: AdminLocationItemData = locationCols;
  const missionRows: AdminMissionItemData[] = missions ?? [];
  const districtName = districts?.name ?? "District";
  const districtBackgroundUrl = districts?.background_image_url ?? null;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title={location.name} backHref={`/admin/districts/${districtId}`} />

        <nav className="mb-3 flex items-center gap-1.5 text-xs text-white/40">
          <Link href="/admin/districts" className="hover:text-white/70">
            Districts
          </Link>
          <span>›</span>
          <Link href={`/admin/districts/${districtId}`} className="hover:text-white/70">
            {districtName}
          </Link>
          <span>›</span>
          <span className="truncate text-white/60">{location.name}</span>
        </nav>

        <AdminLocationHeader location={locationData} districtBackgroundUrl={districtBackgroundUrl} />

        <h2 className="mb-2 text-label text-white/50">Missions ({missionRows.length})</h2>
        {missionRows.length === 0 ? (
          <p className="mb-6 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
            No missions yet. Create the first one below.
          </p>
        ) : (
          <ul className="mb-6 flex flex-col gap-2">
            {missionRows.map((m) => (
              <AdminMissionItem key={m.id} mission={m} />
            ))}
          </ul>
        )}

        <section className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5">
          <h2 className="mb-4 text-h3 font-bold text-white">New Mission</h2>
          <AdminMissionForm locationId={locationId} nextOrder={missionRows.length} />
        </section>
      </div>
    </main>
  );
}
