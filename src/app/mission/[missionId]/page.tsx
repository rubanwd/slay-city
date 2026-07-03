import Link from "next/link";
import { notFound } from "next/navigation";

import AuthGuard from "@/components/auth/AuthGuard";
import { AppContainer, Section } from "@/components/layout";
import { createClient } from "@/lib/supabase/server";

interface MissionDetailPageProps {
  params: Promise<{ missionId: string }>;
}

export default async function MissionDetailPage({ params }: MissionDetailPageProps) {
  const { missionId } = await params;
  const supabase = await createClient();

  const { data: mission } = await supabase
    .from("missions")
    .select("id, title, description, xp_reward, coin_reward")
    .eq("id", missionId)
    .eq("is_published", true)
    .maybeSingle();

  if (!mission) {
    notFound();
  }

  return (
    <AuthGuard>
      <AppContainer className="justify-center">
        <Section py="none" className="items-center gap-6">
          <span className="text-xs uppercase tracking-widest text-neon-pink font-semibold">
            Mission
          </span>
          <h1 className="text-h2 font-black text-white text-center">{mission.title}</h1>
          {mission.description && (
            <p className="text-white/70 text-center">{mission.description}</p>
          )}
          <div className="flex gap-4">
            <span className="px-4 py-2 rounded-xl bg-white/10 text-lime-green font-bold text-sm">
              +{mission.xp_reward} XP
            </span>
            <span className="px-4 py-2 rounded-xl bg-white/10 text-yellow-400 font-bold text-sm">
              +{mission.coin_reward} 🪙
            </span>
          </div>
          <p className="text-white/40 text-sm text-center max-w-xs">
            Mission gameplay is coming soon — this screen confirms the map correctly links to
            real mission data.
          </p>
          <Link
            href="/map"
            className="text-btn w-full py-4 rounded-2xl border border-white/20 text-white text-center hover:bg-white/10 transition-colors"
          >
            ← Back to Map
          </Link>
        </Section>
      </AppContainer>
    </AuthGuard>
  );
}
