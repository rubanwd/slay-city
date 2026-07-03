import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import AuthGuard from "@/components/auth/AuthGuard";
import { AppContainer, Section } from "@/components/layout";
import { SlayCharacter } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

interface MissionRewardPageProps {
  params: Promise<{ missionId: string }>;
}

export default async function MissionRewardPage({ params }: MissionRewardPageProps) {
  const { missionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: mission } = await supabase
    .from("missions")
    .select("id, title, xp_reward, coin_reward")
    .eq("id", missionId)
    .eq("is_published", true)
    .maybeSingle();

  if (!mission) {
    notFound();
  }

  // Only show the reward screen to a user who has actually completed the mission.
  const { data: progress } = await supabase
    .from("user_progress")
    .select("id")
    .eq("profile_id", user.id)
    .eq("mission_id", missionId)
    .maybeSingle();

  if (!progress) {
    redirect(`/mission/${missionId}`);
  }

  return (
    <AuthGuard>
      <AppContainer className="justify-center">
        <Section className="items-center gap-6 text-center">
          <SlayCharacter size="lg" wiggle aria-label="Slay celebrating" />

          <div className="flex flex-col gap-2">
            <span className="text-label uppercase tracking-widest text-lime-green font-bold">
              Mission Complete
            </span>
            <h1 className="text-display font-black text-white leading-none">{mission.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-5 py-3 rounded-2xl bg-lime-green/15 text-lime-green font-black text-lg">
              +{mission.xp_reward} XP
            </span>
            <span className="px-5 py-3 rounded-2xl bg-yellow-400/15 text-yellow-400 font-black text-lg">
              +{mission.coin_reward} 🪙
            </span>
          </div>

          <Link
            href="/map"
            className={[
              "flex items-center justify-center w-full h-16 rounded-2xl",
              "bg-lime-green text-black font-extrabold uppercase tracking-wide text-lg",
              "hover:brightness-110 active:brightness-90 transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-green focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            ].join(" ")}
          >
            Back to Map
          </Link>
        </Section>
      </AppContainer>
    </AuthGuard>
  );
}
