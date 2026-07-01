"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { AppContainer, Section } from "@/components/layout";

export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/map");
      } else {
        setLoading(false);
      }
    });
  }, [router, supabase]);

  if (loading) {
    return (
      <AppContainer className="items-center justify-center">
        <span className="text-neon-pink text-2xl font-black animate-pulse">SLAY CITY</span>
      </AppContainer>
    );
  }

  return (
    <AppContainer className="justify-center">
      <Section py="none" className="items-center gap-6">
        <h1 className="text-h1 font-black text-white tracking-tight text-center">
          SLAY <span className="text-neon-pink">CITY</span>
        </h1>
        <p className="text-body text-white/50 text-center">
          Explore the city, complete missions, and level up your English!
        </p>
        <div className="flex flex-col gap-3 w-full pt-2">
          <Link
            href="/onboarding"
            className="text-btn w-full py-4 rounded-2xl bg-neon-pink text-white text-center hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
          <button className="text-btn w-full py-4 rounded-2xl border border-white/20 text-white hover:bg-white/10 transition-colors">
            Sign In
          </button>
        </div>
      </Section>
    </AppContainer>
  );
}
