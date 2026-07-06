// SLAY CITY — daily streak Edge Function.
//
// Authenticated users are granted only SELECT/INSERT on `user_stats` (see
// supabase/migrations/20260701000001_initial_schema.sql), so they can never
// write streak values from the browser. This function performs the update
// server-side with the service-role client, which bypasses RLS, and only after
// verifying the caller owns the `profile_id` it was asked to update.
//
// Runtime: Deno (Supabase Edge Runtime). The date/streak maths live in the
// dependency-free ./streak.ts module so they can be unit-tested under Node.

import { createClient } from "npm:@supabase/supabase-js@2";

import { computeStreakUpdate, todayUtc } from "./streak.ts";

interface UpdateStreakResponse {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing authorization header" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  // Resolve the caller from their JWT using the anon key. The profile_id in the
  // request body is never trusted until it is checked against this token.
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();
  if (authError || !user) {
    return jsonResponse({ error: "Invalid or expired token" }, 401);
  }

  let profileId: unknown;
  try {
    ({ profile_id: profileId } = await req.json());
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  if (typeof profileId !== "string" || profileId !== user.id) {
    return jsonResponse({ error: "profile_id does not match authenticated user" }, 403);
  }

  // All privileged reads/writes use the service-role client, which bypasses
  // RLS. This key lives only inside the Edge Function environment and is never
  // exposed to the browser.
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: stats, error: readError } = await admin
    .from("user_stats")
    .select("current_streak, longest_streak, last_activity_date")
    .eq("profile_id", profileId)
    .single();
  if (readError || !stats) {
    return jsonResponse({ error: "User stats not found" }, 404);
  }

  const update = computeStreakUpdate(
    {
      currentStreak: stats.current_streak,
      longestStreak: stats.longest_streak,
      lastActivityDate: stats.last_activity_date,
    },
    todayUtc()
  );

  // Skip the write when the user was already active today — this is what makes
  // completing two missions in the same day idempotent (no double-count).
  if (update.changed) {
    const { error: writeError } = await admin
      .from("user_stats")
      .update({
        current_streak: update.currentStreak,
        longest_streak: update.longestStreak,
        last_activity_date: update.lastActivityDate,
      })
      .eq("profile_id", profileId);
    if (writeError) {
      return jsonResponse({ error: "Failed to update streak" }, 500);
    }
  }

  const body: UpdateStreakResponse = {
    current_streak: update.currentStreak,
    longest_streak: update.longestStreak,
    last_activity_date: update.lastActivityDate,
  };
  return jsonResponse(body);
});
