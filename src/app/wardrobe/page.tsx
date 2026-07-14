import AuthGuard from "@/components/auth/AuthGuard";
import WardrobeGrid, { type WardrobeItemVM } from "@/components/wardrobe/WardrobeGrid";
import { resolveMascotImage } from "@/features/wardrobe/mascot";
import { createClient } from "@/lib/supabase/server";

export default async function WardrobePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Unreachable in practice — middleware redirects unauthenticated requests —
    // but keeps the page well-typed without a non-null assertion.
    return null;
  }

  const [itemsRes, ownedRes, statsRes] = await Promise.all([
    supabase
      .from("wardrobe_items")
      .select(
        "id, name, description, item_type, cost_coins, unlock_level, is_default, image_url, preview_url"
      )
      .eq("is_published", true)
      .order("item_type")
      .order("order_index"),
    supabase
      .from("user_wardrobe_items")
      .select("wardrobe_item_id, equipped, equipped_at")
      .eq("profile_id", user.id),
    supabase.from("user_stats").select("coins, level").eq("profile_id", user.id).maybeSingle(),
  ]);

  const ownedRows = ownedRes.data ?? [];
  const ownedById = new Map(ownedRows.map((row) => [row.wardrobe_item_id, row.equipped]));
  const equippedAtById = new Map(ownedRows.map((row) => [row.wardrobe_item_id, row.equipped_at]));
  const catalog = itemsRes.data ?? [];

  const items: WardrobeItemVM[] = catalog.map((item) => {
    const owned = item.is_default || ownedById.has(item.id);
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.item_type,
      imageUrl: item.image_url,
      cost: item.cost_coins,
      unlockLevel: item.unlock_level,
      isDefault: item.is_default,
      owned,
      equipped: ownedById.get(item.id) ?? false,
    };
  });

  // Mascot preview reflects the most recently equipped item's artwork.
  const mascotImageUrl = resolveMascotImage(
    catalog
      .filter((item) => ownedById.get(item.id) === true)
      .map((item) => ({
        previewUrl: item.preview_url,
        imageUrl: item.image_url,
        equippedAt: equippedAtById.get(item.id) ?? null,
      }))
  );

  return (
    <AuthGuard>
      <WardrobeGrid
        items={items}
        coins={statsRes.data?.coins ?? 0}
        level={statsRes.data?.level ?? 1}
        mascotImageUrl={mascotImageUrl}
      />
    </AuthGuard>
  );
}
