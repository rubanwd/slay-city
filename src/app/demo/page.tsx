import { redirect } from "next/navigation";

import { DEMO_GATE_PATH } from "@/features/demo/demoProgress";
import { getDemoDistrict, readDemoProgress } from "@/features/demo/queries";
import { getMessages } from "@/features/i18n";
import { resolveBrowserLocale } from "@/features/i18n/server";
import CityMap from "@/features/map/CityMap";
import { roleHome } from "@/features/auth/roleRouting";
import { DEFAULT_MASCOT_IMAGE } from "@/features/wardrobe/mascot";
import { createClient } from "@/lib/supabase/server";

/**
 * The first screen of Slay City for someone who has never signed in: a real,
 * playable map instead of a login form.
 *
 * It is the ordinary game map, cut down to what makes sense without an account:
 * one district, every location in it free to pick, and one location's worth of
 * missions before the app asks them to sign up (see `demoProgress.ts`). The
 * language follows the browser — a visitor has no profile to have chosen one on.
 */
export default async function DemoPage() {
  const [supabase, locale, progress] = await Promise.all([
    createClient(),
    resolveBrowserLocale(),
    readDemoProgress(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Someone who is signed in has a real map (or console) of their own — the
  // demo would only hide their progress from them.
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    redirect(profile ? roleHome(profile.role) : "/onboarding");
  }

  // The free location is spent. Only the sign-up wall's "Back" button reopens
  // the demo, which is also what resets it for another location.
  if (progress.gated) {
    redirect(DEMO_GATE_PATH);
  }

  const district = await getDemoDistrict(supabase, progress);
  const messages = getMessages(locale);

  return (
    <CityMap
      district={district}
      // A visitor has earned nothing yet; the demo header shows its hint in
      // place of this scoreboard.
      hud={{ xp: 0, coins: 0, level: 1, currentStreak: 0 }}
      mascotImageUrl={DEFAULT_MASCOT_IMAGE}
      demo={{
        loginHref: "/auth/login",
        loginLabel: messages.demo.logIn,
        missionHrefBase: "/demo/mission",
      }}
    />
  );
}
