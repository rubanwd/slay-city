"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/features/admin/requireAdmin";

import { VIEW_AS_TEACHER_COOKIE } from "./viewAsCookie";

/** Eight hours — long enough for a review session, short enough to expire on its own. */
const VIEW_AS_MAX_AGE = 60 * 60 * 8;

/**
 * Starts an admin "View as Teacher" session: verifies the caller is an admin
 * and the target is a real teacher, stores the teacher id in an httpOnly
 * cookie, then drops the admin into the teacher console. From there the guard,
 * middleware and write actions all treat the admin as that teacher.
 */
export async function enterViewAsTeacher(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return;

  const teacherId = String(formData.get("teacher_id") ?? "").trim();
  if (!teacherId) return;

  const { data: teacher } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", teacherId)
    .eq("role", "teacher")
    .maybeSingle();
  if (!teacher) return;

  const store = await cookies();
  store.set(VIEW_AS_TEACHER_COOKIE, teacherId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VIEW_AS_MAX_AGE,
  });

  redirect("/teacher");
}

/** Ends the "View as Teacher" session and returns the admin to the teachers list. */
export async function exitViewAsTeacher(): Promise<void> {
  const store = await cookies();
  store.delete(VIEW_AS_TEACHER_COOKIE);
  redirect("/admin/teachers");
}
