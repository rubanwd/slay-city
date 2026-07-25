"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { BottomNav, BOTTOM_NAV_CLEARANCE, type NavIconName } from "@/components/layout";
import { CoinAmount, CoinIcon, SlayCharacter } from "@/components/ui";
import {
  equipWardrobeItem,
  purchaseWardrobeItem,
  unequipWardrobeItem,
} from "@/features/wardrobe/actions";
import {
  WARDROBE_CATEGORIES,
  wardrobeCategoryEmoji,
  wardrobeCategoryLabel,
} from "@/features/wardrobe/categories";

export type WardrobeItemVM = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  cost: number;
  unlockLevel: number | null;
  isDefault: boolean;
  owned: boolean;
  equipped: boolean;
};

type WardrobeGridProps = {
  items: WardrobeItemVM[];
  coins: number;
  level: number;
  /** Resolved mascot preview image reflecting the currently equipped items. */
  mascotImageUrl: string;
  /** Shows the bottom nav's Homework tab — true when the student is in a teacher group. */
  showHomework?: boolean;
  /** Tab labels in the student's chosen language — see `studentNavLabels`. */
  navLabels?: Partial<Record<NavIconName, string>>;
};

/** Slot order shown in the grid — the shared category set (no more "color"). */
const CATEGORY_ORDER: readonly string[] = WARDROBE_CATEGORIES;

export default function WardrobeGrid({
  items,
  coins,
  level,
  mascotImageUrl,
  showHomework,
  navLabels,
}: WardrobeGridProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Id of the item whose action is currently running, so only its card shows a
  // busy state rather than the whole grid.
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(itemId: string, action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setBusyId(itemId);
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
      } else {
        router.refresh();
      }
      setBusyId(null);
    });
  }

  // Only the known categories are shown, in slot order. Any retired category
  // still lingering in the catalog (e.g. "color") is intentionally hidden.
  const categories = CATEGORY_ORDER.filter((cat) => items.some((item) => item.category === cat));

  return (
    <main className="min-h-screen bg-black flex flex-col mx-auto w-full max-w-md md:border-x md:border-white/10">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">Wardrobe</h1>
        <CoinAmount value={coins} label={`${coins} coins`} className="text-yellow-300" />
      </header>

      {/* Mascot preview — reflects the currently equipped outfit. */}
      <div className="flex flex-col items-center gap-1 px-6 pt-6 pb-2">
        <style>{`
          @keyframes lookFloat {
            0%, 100% { transform: translateY(0) scale(1); }
            50%      { transform: translateY(-8px) scale(1.04); }
          }
        `}</style>
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white/5 p-3 ring-1 ring-white/10">
          <div className="h-full w-full animate-[lookFloat_3s_ease-in-out_infinite]">
            <SlayCharacter size="full" src={mascotImageUrl} aria-label="Your mascot" />
          </div>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
          Your look
        </span>
      </div>

      {error && (
        <p
          role="alert"
          className="mx-6 mt-4 rounded-xl border border-neon-pink/40 bg-neon-pink/10 px-4 py-2 text-sm text-neon-pink"
        >
          {error}
        </p>
      )}

      <section className={`flex-1 px-6 py-6 ${BOTTOM_NAV_CLEARANCE}`}>
        {items.length === 0 ? (
          <p className="mt-16 text-center text-sm text-white/40">
            No items in the shop yet. Check back soon!
          </p>
        ) : (
          categories.map((category) => (
            <div key={category} className="mb-8 last:mb-0">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/50">
                {wardrobeCategoryLabel(category)}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {items
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <WardrobeCard
                      key={item.id}
                      item={item}
                      coins={coins}
                      level={level}
                      busy={pending && busyId === item.id}
                      disabled={pending}
                      onBuy={() => run(item.id, () => purchaseWardrobeItem(item.id))}
                      onEquip={() => run(item.id, () => equipWardrobeItem(item.id))}
                      onUnequip={() => run(item.id, () => unequipWardrobeItem(item.id))}
                    />
                  ))}
              </div>
            </div>
          ))
        )}
      </section>

      <BottomNav showHomework={showHomework} labels={navLabels} />
    </main>
  );
}

type WardrobeCardProps = {
  item: WardrobeItemVM;
  coins: number;
  level: number;
  busy: boolean;
  disabled: boolean;
  onBuy: () => void;
  onEquip: () => void;
  onUnequip: () => void;
};

function WardrobeCard({
  item,
  coins,
  level,
  busy,
  disabled,
  onBuy,
  onEquip,
  onUnequip,
}: WardrobeCardProps) {
  const levelLocked = !item.owned && item.unlockLevel !== null && level < item.unlockLevel;
  const unaffordable = !item.owned && !levelLocked && coins < item.cost;
  const dimmed = !item.owned && (levelLocked || unaffordable);

  return (
    <div
      className={[
        "relative flex flex-col items-center gap-2 rounded-2xl border bg-white/5 p-2 transition-colors",
        item.equipped ? "border-lime-green" : "border-white/15",
        dimmed ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-white/5">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- catalog art, remote or static
          <img src={item.imageUrl} alt="" className="h-full w-full rounded-xl object-contain p-1" />
        ) : (
          <span className="text-4xl">{wardrobeCategoryEmoji(item.category)}</span>
        )}
      </div>

      <span className="text-center text-xs font-medium text-white/80 leading-tight">
        {item.name}
      </span>

      {item.equipped && (
        <span className="absolute right-2 top-2 rounded-full bg-lime-green px-1.5 py-0.5 text-[10px] font-bold text-black">
          ON
        </span>
      )}

      {/* Action / status row */}
      {item.owned ? (
        item.equipped ? (
          <button
            type="button"
            onClick={onUnequip}
            disabled={disabled}
            className="w-full rounded-lg border border-white/20 px-2 py-1 text-[11px] font-semibold text-white/70 hover:bg-white/10 disabled:opacity-50 transition-colors"
          >
            {busy ? "…" : "Unequip"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onEquip}
            disabled={disabled}
            className="w-full rounded-lg bg-lime-green px-2 py-1 text-[11px] font-bold text-black hover:brightness-95 disabled:opacity-50 transition"
          >
            {busy ? "…" : "Equip"}
          </button>
        )
      ) : levelLocked ? (
        <span className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/15 px-2 py-1 text-[11px] font-semibold text-white/50">
          🔒 Lvl {item.unlockLevel}
        </span>
      ) : (
        <button
          type="button"
          onClick={onBuy}
          disabled={disabled || unaffordable}
          className="w-full rounded-lg bg-neon-pink px-2 py-1 text-[11px] font-bold text-black hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 transition"
        >
          {busy ? (
            "…"
          ) : (
            <span className="inline-flex items-center gap-1">
              <CoinIcon />
              {item.cost}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
