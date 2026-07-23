"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { loadMascotImage, writeMascotImageCookie } from "./loadMascot";

export type PurchaseResult =
  | { ok: true; coinsRemaining: number }
  | { ok: false; error: string };

export type EquipResult = { ok: true } | { ok: false; error: string };

/**
 * Buys a wardrobe item for the signed-in user.
 *
 * All privileged work — checking the price/level, deducting coins from
 * user_stats and creating the ownership row — happens inside the
 * `purchase_wardrobe_item` SECURITY DEFINER function. The browser has no UPDATE
 * grant on user_stats and (after the wardrobe migration) no INSERT grant on
 * user_wardrobe_items, so items can never be acquired for free client-side.
 */
export async function purchaseWardrobeItem(itemId: string): Promise<PurchaseResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to buy an item." };
  }

  const { data, error } = await supabase.rpc("purchase_wardrobe_item", {
    p_item_id: itemId,
  });

  if (error) {
    return { ok: false, error: translatePurchaseError(error.message) };
  }

  const result = data?.[0];
  if (!result) {
    return { ok: false, error: "The item could not be purchased." };
  }

  revalidatePath("/wardrobe");
  return { ok: true, coinsRemaining: result.coins_remaining };
}

/** Equips an owned (or default) item, taking off whatever was worn before. */
export async function equipWardrobeItem(itemId: string): Promise<EquipResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to equip an item." };
  }

  const { error } = await supabase.rpc("equip_wardrobe_item", { p_item_id: itemId });
  if (error) {
    return { ok: false, error: translateEquipError(error.message) };
  }

  await writeMascotImageCookie(await loadMascotImage(supabase, user.id));
  revalidatePath("/wardrobe");
  return { ok: true };
}

/** Takes the item off, leaving the mascot in its default look. */
export async function unequipWardrobeItem(itemId: string): Promise<EquipResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to change your outfit." };
  }

  const { error } = await supabase.rpc("unequip_wardrobe_item", { p_item_id: itemId });
  if (error) {
    return { ok: false, error: error.message };
  }

  await writeMascotImageCookie(await loadMascotImage(supabase, user.id));
  revalidatePath("/wardrobe");
  return { ok: true };
}

function translatePurchaseError(message: string): string {
  if (message.includes("Not enough coins")) return "You don't have enough coins for this item.";
  if (message.includes("Level too low")) return "Reach a higher level to unlock this item.";
  if (message.includes("already owned")) return "You already own this item.";
  if (message.includes("Item not found")) return "This item is no longer available.";
  return message;
}

function translateEquipError(message: string): string {
  if (message.includes("not owned")) return "You need to buy this item first.";
  if (message.includes("Item not found")) return "This item is no longer available.";
  return message;
}
