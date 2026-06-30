"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/map");
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-neon-pink text-2xl font-bold animate-pulse">SLAY CITY</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 px-6">
      <h1 className="text-6xl font-bold text-white tracking-tight">
        SLAY <span className="text-neon-pink">CITY</span>
      </h1>
      <p className="text-gray-400 text-center max-w-xs">
        Explore the city, complete missions, and level up your English!
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/onboarding"
          className="w-full py-4 rounded-2xl bg-neon-pink text-white font-bold text-center text-lg hover:opacity-90 transition-opacity"
        >
          Get Started
        </Link>
        <button className="w-full py-4 rounded-2xl border border-white/20 text-white font-bold text-lg hover:bg-white/10 transition-colors">
          Sign In
        </button>
      </div>
    </main>
  );
}
