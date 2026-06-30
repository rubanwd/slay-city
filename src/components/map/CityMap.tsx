"use client";

import Link from "next/link";

const ZONES = [
  { id: "school", label: "School", emoji: "🏫", color: "bg-cyan", textColor: "text-black" },
  { id: "mall", label: "Mall", emoji: "🛍️", color: "bg-neon-pink", textColor: "text-white" },
  { id: "park", label: "Park", emoji: "🌳", color: "bg-lime-green", textColor: "text-black" },
  { id: "cafe", label: "Café", emoji: "☕", color: "bg-purple", textColor: "text-white" },
];

export default function CityMap() {
  return (
    <main className="min-h-screen bg-black flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white">
          SLAY <span className="text-neon-pink">CITY</span>
        </h1>
        <Link href="/wardrobe" className="text-sm text-lime-green font-semibold">
          Wardrobe →
        </Link>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8">
        <p className="text-white/60 text-sm uppercase tracking-widest">Choose a zone</p>
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {ZONES.map((zone) => (
            <Link
              key={zone.id}
              href={`/mission?zone=${zone.id}`}
              className={`${zone.color} ${zone.textColor} rounded-2xl p-6 flex flex-col items-center gap-2 font-bold text-lg hover:scale-105 transition-transform`}
            >
              <span className="text-4xl">{zone.emoji}</span>
              {zone.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
