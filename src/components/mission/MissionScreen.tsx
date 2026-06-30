"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MissionContent() {
  const params = useSearchParams();
  const zone = params.get("zone") ?? "city";

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 px-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <Link href="/map" className="text-white/40 text-sm hover:text-white transition-colors">
          ← Back to map
        </Link>
        <div className="rounded-3xl border border-neon-pink/40 bg-neon-pink/5 p-6 flex flex-col gap-4">
          <span className="text-xs uppercase tracking-widest text-neon-pink font-semibold">
            Active Mission · {zone}
          </span>
          <h2 className="text-2xl font-bold text-white">What do you say?</h2>
          <p className="text-white/70">
            You walk into the café. The barista looks at you. What do you say to order a drink?
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {["Can I have a latte, please?", "Give coffee!", "I want the brown drink.", "Hello, one coffee."].map(
            (option) => (
              <button
                key={option}
                className="w-full py-4 px-5 rounded-2xl bg-white/10 text-white text-left font-medium hover:bg-neon-pink/20 hover:border-neon-pink border border-transparent transition-all"
              >
                {option}
              </button>
            )
          )}
        </div>
      </div>
    </main>
  );
}

export default function MissionScreen() {
  return (
    <Suspense>
      <MissionContent />
    </Suspense>
  );
}
