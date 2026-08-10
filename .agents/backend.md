# Backend

The backend is built with Supabase.

Backend responsibilities:

* User authentication (email/password, Google OAuth, password reset)
* User profile management, including knowledge level (5-level track, one published today)
* Mission content storage
* Vocabulary storage
* Progress tracking (including partial-credit completion and level-up detection)
* XP and coin management
* Daily streak logic
* Wardrobe ownership
* Parent dashboard data (progress, streaks, study time, homework summary)
* Teacher group/homework management (groups, topics, AI-drafted vocab/grammar content,
  per-topic Q&A)
* Study-time telemetry
* In-app feedback/bug reports
* Admin content management
* AI content generation through secure backend functions (both image art and, for
  teacher homework drafting, text/JSON generation)

Backend must validate all important game-state changes.

As implemented, "backend function" mostly means a Postgres `SECURITY DEFINER`
RPC function (`supabase/migrations/`), invoked via `supabase.rpc(...)` from a
Next.js Server Action — not a Supabase Edge Function. The only real Edge
Function in the project is `update-streak` (`supabase/functions/update-streak/`).

Main backend functions, by category:

```txt
# Mission / progress
complete_mission(p_mission_id, p_reward_fraction default 1) — SECURITY DEFINER RPC
reset_location_progress          — SECURITY DEFINER RPC
reset_level_progress             — SECURITY DEFINER RPC
reset_my_progress                — SECURITY DEFINER RPC, still granted to authenticated
                                    but no longer called from anywhere: the dev-only
                                    "Reset Progress" button and its server action were
                                    removed from the profile screen. Drop or admin-gate
                                    it in a future migration.
advance_my_level_if_cleared / knowledge_level_completed — internal only, not granted
                                    to authenticated

# Wardrobe
purchase_wardrobe_item           — SECURITY DEFINER RPC
equip_wardrobe_item              — SECURITY DEFINER RPC (one item equipped at a time)
unequip_wardrobe_item            — SECURITY DEFINER RPC

# Knowledge level
available_knowledge_levels       — SECURITY DEFINER RPC
set_my_knowledge_level           — SECURITY DEFINER RPC

# Parent/student linking
link_student_by_email            — SECURITY DEFINER RPC
is_linked_student                — SECURITY DEFINER RPC (RLS helper)
parent_student_homework          — SECURITY DEFINER RPC

# Teacher
promote_teacher / revoke_teacher — SECURITY DEFINER RPCs (admin-only, see auth doc)
teaches_student / is_teacher     — SECURITY DEFINER RPCs (RLS helpers)
set_location_map_position        — SECURITY DEFINER RPC (teacher or admin)
my_groups / is_group_member      — SECURITY DEFINER RPCs

# Homework
complete_homework_vocab / complete_homework_grammar — SECURITY DEFINER RPCs
                                    (idempotent flat-XP grant per topic/student)
get_topic_messages / get_unread_topics — SECURITY DEFINER RPCs

# Feedback
list_feedback_reports / unread_feedback_count / mark_feedback_read — SECURITY
                                    DEFINER RPCs (admin-only inbox)

# Study time
record_study_time                — SECURITY DEFINER RPC (student-only, clamps to
                                    ≤120s per call)

# Admin
is_admin / claim_admin           — SECURITY DEFINER RPCs
prevent_role_escalation          — trigger function
admin_list_users                 — SECURITY DEFINER RPC (admin-only; every account
                                    with its auth.users email, paged + filtered)
admin_create_profile             — SECURITY DEFINER RPC (profile + user_stats for an
                                    account the console just signed up)
admin_set_user_role              — SECURITY DEFINER RPC (any role → any role; drops
                                    the old role's groups/allow-list entry, refuses
                                    self-demotion)
admin_delete_user                — SECURITY DEFINER RPC (deletes the auth.users row;
                                    everything cascades, refuses self-deletion)
admin_derive_username            — internal helper (execute revoked from public)

# Edge Function
updateStreak                     — Supabase Edge Function

# Next.js Server Actions calling OpenRouter (not Postgres RPCs)
generateLocationIcon / generateMapBackground / generateTaskImage — image generation
  (google/gemini-2.5-flash-image), requireAdmin-gated
Teacher grammar/vocabulary drafting (grammarPrompt.ts / vocabularyPrompt.ts, via
  openRouterChat.ts) — text/JSON generation (google/gemini-2.5-flash), requireTeacher-gated
```

Backend rules:

* Never trust the client for rewards or progress.
* All XP, coins, streaks, and unlocks must be processed server-side.
* OpenRouter API keys must never be exposed to the frontend (there is no OpenAI key in this project).
* User data must be protected with Row Level Security.
* Admin-only actions must be restricted by role (`requireAdmin` / `is_admin`).
* Teacher-only actions must be restricted by role (`requireTeacher`, which also accepts
  an admin currently impersonating a teacher via the "view as teacher" cookie).
