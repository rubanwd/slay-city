"use client";

import Link from "next/link";

import { BottomNav } from "@/components/layout";

const ITEMS = [
  { id: 1, name: "Neon Jacket", emoji: "🧥", rarity: "rare", locked: false },
  { id: 2, name: "Cyber Shades", emoji: "🕶️", rarity: "epic", locked: false },
  { id: 3, name: "Star Kicks", emoji: "👟", rarity: "common", locked: true },
  { id: 4, name: "Pink Cap", emoji: "🧢", rarity: "common", locked: true },
  { id: 5, name: "Gold Chain", emoji: "📿", rarity: "legendary", locked: true },
  { id: 6, name: "City Bag", emoji: "👜", rarity: "rare", locked: true },
];

const RARITY_COLORS: Record<string, string> = {
  common: "border-white/20",
  rare: "border-cyan",
  epic: "border-purple",
  legendary: "border-yellow-400",
};

export default function WardrobeGrid() {
  return (
    <main className="min-h-screen bg-black flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/map" className="text-white/40 text-sm hover:text-white transition-colors">
          ← Map
        </Link>
        <h1 className="text-xl font-bold text-white">Wardrobe</h1>
        <span className="text-neon-pink font-bold">✦ 240</span>
      </header>

      <section className="flex-1 px-6 py-6 pb-28">
        <div className="grid grid-cols-3 gap-3">
          {ITEMS.map((item) => (
            <div
              key={item.id}
              className={`relative rounded-2xl border ${RARITY_COLORS[item.rarity]} bg-white/5 aspect-square flex flex-col items-center justify-center gap-1 ${item.locked ? "opacity-50" : "hover:bg-white/10"} transition-colors`}
            >
              <span className="text-4xl">{item.emoji}</span>
              <span className="text-xs text-white/60 font-medium text-center px-1">{item.name}</span>
              {item.locked && (
                <span className="absolute top-2 right-2 text-xs">🔒</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
