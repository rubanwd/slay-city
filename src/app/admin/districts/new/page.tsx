import AdminHeader from "@/features/admin/AdminHeader";
import AdminTaxonomyForms, { type DistrictOption } from "@/features/admin/AdminTaxonomyForms";
import { requireAdminPage } from "@/features/admin/guard";

/** Create a district, and a location within an existing district. */
export default async function NewDistrictLocationPage() {
  const { supabase } = await requireAdminPage();

  const { data: districts } = await supabase
    .from("districts")
    .select("id, name")
    .order("order_index");

  const options: DistrictOption[] = (districts ?? []).map((d) => ({ id: d.id, name: d.name }));

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title="Districts & Locations" backHref="/admin" />
        <AdminTaxonomyForms districts={options} />
      </div>
    </main>
  );
}
