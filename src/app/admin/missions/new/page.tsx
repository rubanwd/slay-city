import AdminHeader from "@/features/admin/AdminHeader";
import AdminMissionEditor from "@/features/admin/AdminMissionEditor";
import { requireAdminPage } from "@/features/admin/guard";
import { toLocationOptions } from "@/features/admin/locationOptions";

/** Form to create a new mission, linked to an existing location. */
export default async function NewMissionPage() {
  const { supabase } = await requireAdminPage();

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, districts(name)")
    .order("order_index");

  const options = toLocationOptions(locations);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title="New Mission" backHref="/admin/missions" />
        <AdminMissionEditor locations={options} />
      </div>
    </main>
  );
}
