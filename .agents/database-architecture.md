# Database Architecture

The database is PostgreSQL in Supabase, defined by ~64 sequential migration files in
`supabase/migrations/`. Every table created there has RLS enabled in the same or an
immediately following migration; reward-bearing tables (`user_stats`, `user_progress`,
`user_wardrobe_items`) intentionally have no `UPDATE` grant for `authenticated` at all —
every mutation goes through a `SECURITY DEFINER` RPC (see [backend.md](backend.md)).

Main tables, grouped by area:

```txt
# Core / content
profiles
districts
locations
missions
vocabulary_items
mission_tasks
task_type_templates
user_progress
user_stats

# Wardrobe
wardrobe_items
user_wardrobe_items

# Admin / access control
admin_emails
parent_student_links

# Teacher / groups / homework
teacher_groups
teacher_group_members
homework_topics
homework_vocab_words
homework_vocab_tasks
homework_vocab_completions
homework_grammar_points
homework_grammar_tasks
homework_grammar_completions
homework_topic_messages
homework_topic_reads

# Caches / telemetry / feedback
vocab_image_cache
task_image_cache
study_time_daily
feedback_reports
feedback_report_reads

# Legacy — schema exists, no app code reads or writes them today
achievements
user_achievements
ai_content_drafts
```

Table purposes:

```txt
profiles
Student/parent/teacher/admin profile row. Carries `role` (user_role enum) and, for
students, `level` (knowledge_level enum — which content track they're on).

districts
City districts, each scoped to one knowledge `level`. Support draft/published states.

locations
Map locations inside districts. Carry `map_x`/`map_y`; movable by teachers/admins via
`set_location_map_position`.

missions
Learning missions connected to locations. xp/coin reward amounts live here.

vocabulary_items
English words, translations, images, audio, and examples used by mission tasks.

mission_tasks
Task steps for a mission — `task_type` (mission_task_type enum, ~32 values) + jsonb content.

task_type_templates
One admin-curated example/preview row per mission_task_type, used by the admin Task
Types configurator/tester.

user_progress
Completed missions per user, including xp_earned/coins_earned actually awarded
(missions can be completed for partial credit via a reward fraction).

user_stats
XP, coins, level, current streak, and longest streak.

wardrobe_items
Catalog of available Slay accessories/skins. `item_type` is a free-text category
(hat, glasses, accessory, color, …), not an enum.

user_wardrobe_items
Purchased/unlocked accessories per user. Only one item can be equipped at a time
per profile (art is not composited — equipping swaps the rendered skin, it doesn't
layer categories).

admin_emails
Allowlist of email addresses permitted to self-claim the admin role (see claim_admin RPC).

parent_student_links
Links a parent account to one or more student profiles (see link_student_by_email RPC).
Renamed from parent_child_links (student_id renamed from child_id) when the "child"
role was renamed to "student".

teacher_groups
A group of students owned by one teacher.

teacher_group_members
Student membership in a teacher_group.

homework_topics
A lesson topic assigned by a teacher to their group; can carry a free-form note
(text/link/image).

homework_vocab_words / homework_vocab_tasks / homework_vocab_completions
The vocabulary module of a homework topic: AI-drafted word list, its generated test,
and per-student completion (flat XP, granted once per topic/student).

homework_grammar_points / homework_grammar_tasks / homework_grammar_completions
The grammar module of a homework topic: AI-drafted rule points, generated test, and
per-student completion (same idempotent-XP pattern as vocab).

homework_topic_messages
Shared Q&A chat thread for a homework topic (teacher + their group's students).

homework_topic_reads
Per-user last-read marker for a homework_topic_messages thread.

vocab_image_cache
Shared cache of AI-generated flashcard images, keyed by normalized word
(teacher/admin-only writers).

task_image_cache
Same idea as vocab_image_cache, for admin-generated mission-task subject images.

study_time_daily
Seconds a student spent on learning screens, bucketed per UTC day (record_study_time
RPC; readable by the student, their linked parent, their teacher, and admins).

feedback_reports
Bug/feedback submissions from students and teachers only (parents/admins are excluded
by design — an admin who finds a bug fixes it instead of reporting it), with up to
5 screenshot URLs.

feedback_report_reads
Per-admin read markers for the feedback inbox.

achievements / user_achievements (legacy)
Achievement catalog and per-user unlocks. Schema only — no current server action,
RPC, or component reads or writes these tables.

ai_content_drafts (legacy)
Was meant to stage AI-generated content before admin review/publish. Schema only —
unused by current app code; AI-generated content (teacher homework drafts, admin art)
is reviewed/published through feature-specific tables and actions instead.
```

## Enums

```txt
user_role
  student, parent, admin, teacher
  ("child" was renamed to "student"; "teacher" was added later as a 4th role.)

mission_task_type
  ~32 active values (vocabulary, matching, quiz, snake_game, word_scramble, hangman,
  bubble_pop, memory_cards, emoji_decode, word_search, crossword, category_sort,
  odd_one_out, sentence_builder, fill_blank, spelling_bee, true_false, flashcards,
  story_sequencing, counting_game, simon_sequence, reaction_tap, picture_reveal,
  rhyme_match, letter_fill, dialogue_choice, cause_effect, analogy, antonym_match,
  size_order, spot_the_difference, clock_reading). The enum was rebuilt once to drop
  8 never-published types — do not assume every historical value still exists.

knowledge_level
  beginner, elementary, pre_intermediate, intermediate, upper_intermediate (declared
  in learning order). Only `elementary` has published content today;
  `available_knowledge_levels()` is the source of truth for which levels are offered.

ai_content_draft_status
  pending, approved, rejected — only consumer (ai_content_drafts) is unused.
```

Database rules:

* Learning content must be stored in the database.
* User progress must be stored per student profile.
* Reward-related data must be updated only through backend functions (`SECURITY DEFINER`
  RPCs), never via direct client `UPDATE`/`INSERT` on `user_stats`, `user_progress`, or
  `user_wardrobe_items`.
* All user-related tables must be protected with Row Level Security.
* Admin content (districts, locations, missions, vocabulary_items, mission_tasks,
  wardrobe_items) should support draft and published states.
* Do not resurrect `achievements`/`user_achievements`/`ai_content_drafts` usage without
  first checking whether the feature they were meant for has since been implemented a
  different way (e.g. homework completions already carry their own reward logic).
