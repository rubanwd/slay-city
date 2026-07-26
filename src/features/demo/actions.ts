"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  advanceDemoProgress,
  DEMO_GATE_PATH,
  DEMO_PROGRESS_COOKIE,
  DEMO_PROGRESS_MAX_AGE,
  parseDemoProgress,
  serializeDemoProgress,
} from "./demoProgress";
import { getDemoMissionLocationId, getLocationMissionIds } from "./queries";

export type DemoMissionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

/**
 * Records a demo mission as finished and says where the visitor goes next.
 *
 * Nothing is written to the database: a visitor has no account, so there is no
 * XP, no coins, no streak and no `user_progress` row — the run lives entirely in
 * the visitor's own cookie. Finishing the last mission of the location closes
 * the demo, and the visitor is sent to the login screen (see
 * {@link DEMO_GATE_PATH}); until then they land back on the demo map with the
 * location they are working through selected.
 */
export async function completeDemoMission(missionId: string): Promise<DemoMissionResult> {
  const supabase = await createClient();

  // A signed-in player must never come through here — their progress belongs in
  // the database, via `submitMissionCompletion`.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    return { ok: true, redirectTo: `/mission/${missionId}` };
  }

  const locationId = await getDemoMissionLocationId(supabase, missionId);
  if (!locationId) {
    return { ok: false, error: "This mission is not part of the demo." };
  }

  const cookieStore = await cookies();
  const progress = parseDemoProgress(cookieStore.get(DEMO_PROGRESS_COOKIE)?.value);
  const locationMissionIds = await getLocationMissionIds(supabase, locationId);
  const next = advanceDemoProgress(progress, missionId, locationMissionIds);

  cookieStore.set(DEMO_PROGRESS_COOKIE, serializeDemoProgress(next), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEMO_PROGRESS_MAX_AGE,
  });

  // The map reads that cookie server-side, so it has to be re-rendered for the
  // location's mission count to move.
  revalidatePath("/demo");

  return {
    ok: true,
    redirectTo: next.gated ? DEMO_GATE_PATH : `/demo?focus=${encodeURIComponent(locationId)}`,
  };
}

/**
 * Clears the demo run and returns to the map — what the "Back" button on the
 * login screen does. The visitor gets a fresh allowance: one more location,
 * whichever one they pick this time.
 */
export async function restartDemo(): Promise<never> {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_PROGRESS_COOKIE);
  redirect("/demo");
}
