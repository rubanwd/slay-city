import AdminCreateModal from "@/features/admin/AdminCreateModal";
import AdminHeader from "@/features/admin/AdminHeader";
import AdminWardrobeForm from "@/features/admin/AdminWardrobeForm";
import AdminWardrobeItem, { type AdminWardrobeItemData } from "@/features/admin/AdminWardrobeItem";
import { requireAdminPage } from "@/features/admin/guard";
import { WARDROBE_CATEGORIES, WARDROBE_CATEGORY_META } from "@/features/wardrobe/categories";

/** Manage the wardrobe catalog: upload item art, set prices, publish for all students. */
export default async function AdminWardrobePage() {
  const { supabase } = await requireAdminPage();

  const { data } = await supabase
    .from("wardrobe_items")
    .select("id, name, item_type, cost_coins, unlock_level, image_url, order_index, is_published")
    .order("item_type")
    .order("order_index");

  const items: AdminWardrobeItemData[] = data ?? [];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title="Wardrobe" backHref="/admin" />

        <p className="mb-4 mt-2 text-small text-white/50">
          Upload art and set a price for each item. Published items appear in every student&apos;s
          wardrobe, and equipping one changes their mascot.
        </p>

        {items.length === 0 ? (
          <p className="mb-6 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
            No items yet. Create the first one below.
          </p>
        ) : (
          WARDROBE_CATEGORIES.map((category) => {
            const rows = items.filter((i) => i.item_type === category);
            if (rows.length === 0) return null;
            return (
              <section key={category} className="mb-6">
                <h2 className="mb-2 text-label uppercase tracking-widest text-white/50">
                  {WARDROBE_CATEGORY_META[category].label} ({rows.length})
                </h2>
                <ul className="flex flex-col gap-3">
                  {rows.map((item) => (
                    <AdminWardrobeItem key={item.id} item={item} />
                  ))}
                </ul>
              </section>
            );
          })
        )}

        <AdminCreateModal triggerLabel="Add Item" title="New Item">
          <AdminWardrobeForm mode="create" />
        </AdminCreateModal>
      </div>
    </main>
  );
}
