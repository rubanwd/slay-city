"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type Status = "checking" | "ok" | "error";

export default function SupabaseTestPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("");
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    async function checkClient() {
      try {
        // getSession() is a lightweight call that doesn't require a real project URL
        // to confirm the client itself initialized without throwing
        const { error } = await supabase.auth.getSession();

        if (error) {
          setStatus("error");
          setMessage(error.message);
        } else {
          setStatus("ok");
          setMessage("Supabase client initialized successfully.");
        }
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Unknown error");
      }
    }

    checkClient();
  }, [supabase]);

  const statusStyles: Record<Status, string> = {
    checking: "text-yellow-400",
    ok: "text-lime-green",
    error: "text-neon-pink",
  };

  const statusLabels: Record<Status, string> = {
    checking: "⏳ Checking...",
    ok: "✓ Connected",
    error: "✗ Error",
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-3xl font-bold text-white">
        Supabase <span className="text-cyan">Client Test</span>
      </h1>

      <div className="w-full max-w-sm bg-white/5 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-sm">Status</span>
          <span className={`font-bold ${statusStyles[status]}`}>
            {statusLabels[status]}
          </span>
        </div>

        {message && (
          <p className="text-white/70 text-sm leading-relaxed">{message}</p>
        )}

        <div className="border-t border-white/10 pt-4 flex flex-col gap-2 text-xs text-white/40">
          <span>
            URL:{" "}
            <code className="text-white/60">
              {process.env.NEXT_PUBLIC_SUPABASE_URL ?? "not set"}
            </code>
          </span>
          <span>
            Key:{" "}
            <code className="text-white/60">
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 12)}…`
                : "not set"}
            </code>
          </span>
        </div>
      </div>

      <p className="text-white/30 text-xs text-center max-w-xs">
        Replace placeholders in <code>.env.local</code> with real Supabase
        project values to test a live connection.
      </p>
    </main>
  );
}
