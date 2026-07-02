"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import LogoutButton from "@/features/auth/LogoutButton";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/");
      } else {
        setChecking(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-neon-pink text-2xl font-bold animate-pulse">Loading…</span>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <LogoutButton />
      </div>
      {children}
    </>
  );
}
