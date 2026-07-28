# AGENTS.md — SLAY CITY Operating Manual

> This document is the authoritative operating manual for all AI coding agents working on SLAY CITY. Read it in full before writing a single line of code.

---

## Development Commands

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Type-check the entire project
npm run type-check

# Lint the entire project
npm run lint

# Run unit tests
npm run test

# Build for production
npm run build

# Run production build locally
npm run start
```

**Supabase local development:**
```bash
# Start Supabase local stack
npx supabase start

# Inspect which migrations are pending (READ-ONLY — safe)
npx supabase migration list

# Generate TypeScript types from the database schema
npx supabase gen types typescript --local > src/types/supabase.ts

# Deploy an Edge Function
npx supabase functions deploy <function-name>
```

> If these scripts are not yet defined in `package.json`, add them before executing. Never run a command that could mutate production data unless explicitly authorized.

> **Never run `npx supabase db push` by hand.** There is only one Supabase environment and it is production — the dev server talks to it too, so `db push` is a production schema change with no PR, no review and no rollback. The `migrate` job in `.github/workflows/ci.yml` applies migrations automatically on every push to `main`. Write the migration file, merge the PR, and let CI apply it. See [Git and Release Workflow](#git-and-release-workflow).

---

## Project Structure Rules

Follow this directory layout exactly. Do not create top-level directories outside this structure without permission.

```
src/
  app/              # Next.js App Router pages and layouts
  components/       # Shared, reusable UI primitives (+ Storybook stories/docs)
  features/         # Feature-scoped modules — 16 directories today: admin, auth,
                     # demo, feedback, homework, i18n, levels, map, mission,
                     # onboarding, parent, profile, reward, study, teacher, wardrobe
  hooks/            # Custom React hooks
  lib/              # Third-party client instances (Supabase client, etc.)
  types/            # TypeScript types and generated Supabase types
  styles/           # Global styles and Tailwind config extensions

supabase/
  functions/        # Supabase Edge Functions — as-built, this is just update-streak
  migrations/       # Ordered SQL migration files
```

> **As-built deviation:** `src/services/` exists only as an empty `.gitkeep` stub —
> do not add code there without confirming with the user first. Each
> `src/features/<feature-name>/` directory owns its own `actions.ts`
> (Next.js Server Actions, `"use server"`) that talks to Supabase directly —
> either a plain table query or `supabase.rpc(...)` against a Postgres
> `SECURITY DEFINER` function in `supabase/migrations/`. Follow that pattern
> for new features rather than reintroducing a `services/` layer. There is also a
> `src/stories/` directory that is leftover Storybook/CRA-init boilerplate
> (`Button`/`Header`/`Page`) — it is not real app code, do not treat it as a pattern
> to follow.

- Place feature-specific components directly inside `src/features/<feature-name>/` (this repo does not use a further `components/` subfolder per feature).
- Place feature-specific hooks inside `src/features/<feature-name>/` or `src/hooks/`.
- Never put business logic directly inside `src/app/` page files — delegate to `src/features/<feature-name>/actions.ts` and components.
- Never put Edge Function source code anywhere except `supabase/functions/`. In practice, prefer a Postgres `SECURITY DEFINER` RPC function over a new Edge Function unless the logic needs the service-role client or Deno-only capabilities (see `supabase/functions/update-streak/`).
- Keep each file focused on a single responsibility.
- Storybook (`npm run storybook`) documents `src/components/ui` and select `src/features/*` components via `.stories.tsx`/`.mdx` files — add stories for new shared UI primitives.

---

## Coding Standards

### Language and Framework
- Use **TypeScript** everywhere. No `.js` or `.jsx` files.
- Use **Next.js App Router** conventions (Server Components by default, Client Components only when required).
- Use **Tailwind CSS** for all styling. No inline `style` props except for dynamic values that cannot be expressed in Tailwind.
- Do not introduce additional CSS frameworks or CSS-in-JS libraries.

### TypeScript
- Enable strict mode. Do not suppress TypeScript errors with `// @ts-ignore` or `any` unless absolutely unavoidable — if used, leave a comment explaining why.
- All API responses must be typed. Use generated Supabase types from `src/types/supabase.ts`.
- Define shared domain types in `src/types/`. Do not duplicate type definitions.

### Naming Conventions
- React components: `PascalCase` (e.g., `CityMap`, `RewardModal`).
- Hooks: `camelCase` prefixed with `use` (e.g., `useUserProgress`).
- Files: match the exported component or function name (e.g., `CityMap.tsx`, `useUserProgress.ts`).
- Supabase Edge Functions: `kebab-case` directory names (e.g., `complete-mission`).
- Database columns: `snake_case` (enforced by PostgreSQL convention).
- Constants: `SCREAMING_SNAKE_CASE`.

### Components
- Keep components small and single-purpose.
- Use reusable UI components from `src/components/` wherever possible.
- Core components as actually built today (names/locations have drifted from the
  original spec — do not assume the old flat list; verify against the repo before
  reusing a name):
  - `WelcomeScreen` (`src/components/WelcomeScreen.tsx`), `OnboardingForm`
    (`src/features/onboarding/`), `CityMap` + `MapLocationNode` (`src/features/map/`),
    `SlayCharacter` (`src/components/ui/`)
  - `MissionScreen` (`src/components/mission/`), plus 30+ task-type components in
    `src/features/mission/` (of which `VocabularyTask`, `MatchingTask`, `QuizTask` are
    only three — see [frontend.md](.agents/frontend.md) for the full list)
  - `RewardModal` (`src/components/ui/` — a modal) is distinct from the full-screen
    `RewardScreen` (`src/features/reward/`); `ProgressBar` exists in both
    `src/components/ui/` and `src/features/mission/`; `StreakBadge`
    (`src/components/ui/`)
  - `WardrobeGrid` (`src/components/wardrobe/`) — there is no separate
    `WardrobeItemCard`; item cards render inline inside `WardrobeGrid`
  - `ParentDashboard` (`src/features/parent/`)
  - Admin mission editing is `AdminMissionForm` + `AdminMissionItem`
    (`src/features/admin/`), not a single `AdminMissionEditor`
  - `TeacherDashboard`, group/student management, and grammar/vocabulary content
    managers (`src/features/teacher/`) — a whole console added since the original spec

### Brand Colors
Always use the defined brand tokens. Do not use arbitrary color values.

| Token | Hex |
|---|---|
| Neon Pink | `#FF2D8E` |
| Lime Green | `#9DFF00` |
| Cyan | `#00F0FF` |
| Purple | `#6A00FF` |
| Neon Orange | `#FF8A00` |
| Black | `#111111` |
| White | `#FFFFFF` |

Defined as RGB-channel CSS variables in `src/styles/theme.css` (consumed via
`rgb(var(--color-x) / <alpha-value>)`) and wired into `tailwind.config.ts`. Semantic
aliases also exist: `--color-background`, `--color-foreground`, `--color-accent`
(= pink), `--color-highlight` (= lime).

### General Rules
- Do not hardcode learning content (vocabulary, mission text, quiz questions) in frontend files.
- Each screen must have one clear primary action.
- Keep all screens mobile-first. Test at 390px width minimum.

---

## Testing Requirements

- Write **unit tests** for all utility functions in `src/lib/` and `src/features/*`.
- Write **unit tests** for all custom hooks in `src/hooks/` and `src/features/*`.
- Write **integration tests** for all Supabase Edge Functions.
- Tests must pass before any PR is merged.
- CI/CD pipeline must include: lint → type-check → unit tests → build check.
- Do not merge code that introduces TypeScript errors or lint failures.
- **Test runner: Vitest** (`npm run test` runs `vitest run --project unit`). Do not introduce Jest.
- Cover all game-state mutation paths (`submitMissionCompletion`/`complete_mission`, `purchaseWardrobeItem`, `equipWardrobeItem`/`unequipWardrobeItem`, `updateStreak`, `completeHomeworkVocab`/`completeHomeworkGrammar`, `recordStudyTime`) with tests that verify server-side validation is enforced.

Test file convention: colocate `*.test.ts` next to the module it covers
(e.g. `src/features/map/mapState.test.ts`, `supabase/functions/update-streak/index.test.ts`).
Edge Function logic that needs unit tests should be split into a
dependency-free module (see `update-streak/streak.ts`) so it can run under
Vitest/Node instead of only the Deno runtime.

---

## MVP Scope

The MVP must prove one hypothesis: **students are motivated to return daily, complete short English missions, and progress through the city.**

### Include in MVP
- User registration and login (email/password, plus Google OAuth — magic link was
  never actually implemented, do not assume it exists)
- Role assignment: `student`, `parent`, `admin`, and `teacher` (promotion-only, added
  after the original MVP — see [authentication-and-roles.md](.agents/authentication-and-roles.md))
- City map screen showing unlocked, current, completed, and locked locations
- Daily mission flow across 30+ task types (see `src/features/mission/`)
- Reward screen after mission completion (XP, coins)
- Basic streak tracking, plus per-day study-time telemetry
- Wardrobe screen for Slay customization (view and equip one owned item at a time)
- Parent dashboard: completed missions, daily streaks, vocabulary learned, map
  progress, study time, homework summary
- Teacher console: manage groups of students, author vocabulary/grammar homework
  topics with AI-assisted drafting, per-topic Q&A, read-only map/mission preview
- Admin content screen: create/edit districts, locations, missions, vocabulary,
  wardrobe items, task-type templates; generate AI art; publish/unpublish content;
  manage the admin allowlist, teachers, and the feedback inbox
- Progressive Web App manifest and service worker (`public/manifest.json`, `public/sw.js`)

### Core API Operations — as actually implemented
There is no centralized read-operation layer (no `getProfile`/`getDistricts`/etc.) —
reads happen inline in server components or via feature-local `queries.ts` files. Full,
current action inventory by feature directory lives in
[api-architecture.md](.agents/api-architecture.md). Notably: `startMission` and
`submitMissionAnswer` (from an earlier version of this doc) do not exist — mission
completion is a single `submitMissionCompletion` action calling the `complete_mission`
RPC.

### The Protected Loop
Every task you implement must serve this loop:
```
Map → Mission → Reward → Unlock → Return Tomorrow
```
If a feature does not improve learning, engagement, retention, progress visibility, or parent trust, **do not build it in the MVP**.

---

## Definition of Done

A task is **Done** only when ALL of the following are true:

- [ ] The feature works correctly on mobile (390px width minimum).
- [ ] All TypeScript types are defined; no `any` without justification comment.
- [ ] Lint passes with zero errors.
- [ ] All new utility functions and hooks have unit tests.
- [ ] All Edge Functions have integration tests.
- [ ] No learning content is hardcoded in frontend files.
- [ ] No XP, coin, streak, or unlock logic runs on the client — all processed server-side.
- [ ] No API keys or secrets appear in frontend code or the repository.
- [ ] Row Level Security policies are applied to all new user-related tables.
- [ ] The feature uses the correct brand colors via Tailwind tokens.
- [ ] The feature is mobile-first and has one clear primary action per screen.
- [ ] The CI pipeline (lint → type-check → tests → build) passes.
- [ ] The PR description clearly states what was built and why it serves the core loop.

---

## Agent Workflow

Follow this workflow for every task:

1. **Read this file in full** before starting any work.
2. **Identify the task scope** — map it to a feature in `src/features/` and determine which API operations it requires.
3. **Check existing code** — search for related components, hooks, services, and types before creating new files.
4. **Plan before writing** — list the files you will create or modify and confirm they follow the project structure rules.
5. **Implement in this order:**
   1. Database migration (if schema change required)
   2. TypeScript types (update `src/types/supabase.ts` and domain types)
   3. Edge Function (if server-side logic required)
   4. Service layer (`src/services/`)
   5. Hook (`src/hooks/` or feature hook)
   6. Component
   7. Page/route
6. **Write tests** alongside implementation, not after.
7. **Run the full check suite** (`lint`, `type-check`, `test`, `build`) before marking work complete.
8. **Never modify production data** or deploy to production without explicit authorization.
9. **Never commit secrets** — use environment variables only.
10. **Document any deviation** from this manual in the PR description with a clear reason.

---

## Git and Release Workflow

Every change reaches production the same way: **branch → PR → green CI → squash merge → verify the deploy.** There are no shortcuts, and "merge it" means this entire sequence, not just the merge button.

### Before writing any code

1. `git fetch origin` and fast-forward `main`. **Never start from a stale checkout.** Work lands here via PRs merged on GitHub, often from another machine, so a local `main` can be dozens of commits behind without any sign. If the user describes or screenshots a screen you cannot find in the code, suspect a stale checkout before concluding the feature does not exist — `git log --oneline main..origin/main` shows the gap immediately.
2. Never commit directly to `main`. Branch first: `feat/…`, `fix/…`, or `docs/…`.

### Shipping the change

3. Run `lint`, `type-check`, `test` locally and fix everything before committing.
4. Commit, push the branch, and open a PR whose description states what was built and anything left unverified.
5. **Wait for CI to pass** — `gh pr checks <n> --watch`. Never merge into a red or still-running build.
6. Merge with `gh pr merge <n> --squash --delete-branch`. Squash is the house style: it keeps `main` one commit per change.

### After merging — always verify, never assume

7. Confirm `main` moved: `git checkout main && git pull --ff-only && git log --oneline -1`.
8. Confirm CI on `main` is green, **including the `migrate` job** if the change carried a migration.
9. Confirm Vercel promoted the new commit to **Production** — a merge is not a deploy:
   `gh api repos/<owner>/<repo>/deployments --jq '.[0] | "\(.environment) \(.sha[0:7])"'`
10. Report what actually shipped, and state plainly anything you could not verify.

### Standing rules

- **Squash merge hides what is merged from git.** `git branch --merged` can never recognise a squash-merged branch, so branch state must be checked against PRs (`gh pr list --state merged`), never against `git --merged`.
- Branch auto-delete is enabled on the repository. If you delete branches manually, verify each branch's tip SHA equals the tip its PR merged (`headRefOid`) — a branch pushed to after its PR merged holds work that exists nowhere else.
- Migrations apply themselves via CI (see above). Pick a migration timestamp not already applied on remote; reusing one makes `db push` treat your file as applied and **silently skip it**.

---

## Security Rules

- **Never expose the OpenRouter API key to the frontend.** All OpenRouter calls must go through Next.js Server Actions (this project does not use OpenAI or an Edge Function for this).
- **Never expose Supabase service role keys to the frontend.** Use the anon key only in the browser.
- **Never store API keys, database credentials, or service tokens in the repository.** Use Vercel Environment Variables and Supabase Secrets.
- **Never trust the client for game-state changes.** XP, coins, streaks, and location unlocks must be computed and written server-side.
- **Never allow the browser to directly update** `user_stats`, `user_progress`, or `user_wardrobe_items` tables.
- Apply Row Level Security (RLS) to every user-related table. No exceptions.
- Enforce role checks on both frontend routes (redirect unauthorized users) and backend Edge Functions (reject unauthorized requests).
- Student users must only access their own profile and progress data.
- Parent users must only access profiles explicitly linked to their account.
- Admin-only Edge Functions must verify the caller has the `admin` role before executing.
- Validate all inputs server-side before processing any user action.

---

## Database / Supabase Rules

### Schema
Maintain migrations in `supabase/migrations/` with sequential, descriptive filenames (e.g., `20240601_create_profiles.sql`).

### Required Tables
Implement all of the following tables. Do not rename them without a clear migration
path (several already have a rename history — see notes below).

| Table | Purpose |
|---|---|
| `profiles` | Student/parent/teacher/admin profile data (incl. `level`, the knowledge level a student studies) |
| `districts` | City districts, each belonging to one knowledge `level` |
| `locations` | Map locations inside districts |
| `missions` | Learning missions connected to locations |
| `vocabulary_items` | English words, translations, images, audio, examples |
| `mission_tasks` | Task steps across 30+ task types |
| `task_type_templates` | Default config per task type, used by the admin Task Types configurator/tester |
| `user_progress` | Completed missions and unlocked progress (incl. `xp_earned`/`coins_earned` actually awarded) |
| `user_stats` | XP, coins, level, current streak, longest streak |
| `wardrobe_items` | Available Slay accessories |
| `user_wardrobe_items` | Purchased/unlocked accessories per user (only one equipped at a time) |
| `admin_emails` | Allowlist of emails permitted to self-claim the admin role (`claim_admin` RPC) |
| `parent_student_links` | Links a parent account to student profile(s) (`link_student_by_email` RPC). Renamed from `parent_child_links` when the `child` role was renamed to `student`. |
| `study_time_daily` | Seconds a student spent on learning screens, bucketed per UTC day (`record_study_time` RPC) |
| `teacher_groups` / `teacher_group_members` | A teacher's groups of students and their membership |
| `homework_topics` | A teacher-assigned lesson topic (optionally with a note/link/image) |
| `homework_vocab_words` / `homework_vocab_tasks` / `homework_vocab_completions` | The vocabulary module of a homework topic and per-student completion |
| `homework_grammar_points` / `homework_grammar_tasks` / `homework_grammar_completions` | The grammar module of a homework topic and per-student completion |
| `homework_topic_messages` / `homework_topic_reads` | Per-topic Q&A thread and read markers |
| `vocab_image_cache` / `task_image_cache` | Shared caches of AI-generated flashcard/task images |
| `feedback_reports` / `feedback_report_reads` | Student/teacher bug/feedback reports and admin read markers |
| `achievements` / `user_achievements` | **Legacy — schema only, no current app code reads or writes these.** Do not build new features against them without checking whether they should be revived or replaced. |
| `ai_content_drafts` | **Legacy — schema only, unused.** Same caution as above. |

Full per-table detail and the current enum inventory (`user_role`, `mission_task_type`,
`knowledge_level`, `ai_content_draft_status`) lives in
[database-architecture.md](.agents/database-architecture.md) — read it before adding a
migration, since several tables/columns have already been renamed once
(`child`→`student`, `parent_child_links`→`parent_student_links`,
`is_linked_child`→`is_linked_student`, `teaches_child`→`teaches_student`).

### Content hierarchy
Content is nested `Level → District → Location → Mission → Task`. The level is
the `knowledge_level` enum (`beginner`, `elementary`, `pre_intermediate`,
`intermediate`, `upper_intermediate`) on `districts`; a student's map shows only
the published districts matching their own `profiles.level`. A level is offered
to students only once it has a published district with a published location —
`available_knowledge_levels()` is the single source of truth for that, and
`set_my_knowledge_level()` is the only way a student changes level.

### Rules
- All user-related tables must have RLS enabled and appropriate policies defined.
- Admin content tables (`districts`, `locations`, `missions`, `vocabulary_items`, `mission_tasks`) must support `draft` and `published` states.
- Never write to reward-related columns (`xp`, `coins`, `streak`, `unlocked_locations`) from the client.
- All reward and progress mutations must go through named server-side functions: `complete_mission`, `purchase_wardrobe_item`, `equip_wardrobe_item`, `unequip_wardrobe_item`, `complete_homework_vocab`, `complete_homework_grammar`, `record_study_time` (Postgres `SECURITY DEFINER` RPCs) and `updateStreak` (the one actual Edge Function). Never grant the client direct UPDATE/INSERT on the underlying tables. Full RPC inventory in [backend.md](.agents/backend.md).
- Use `supabase gen types typescript` to regenerate `src/types/supabase.ts` after every schema change. Commit the updated types file with the migration.
- Use `snake_case` for all column and table names.
- Define foreign key constraints and appropriate indexes on all join columns.

---

## UI Implementation Rules

- **Mobile-first always.** Design at 390px, then scale up. No desktop-first layouts.
- **Dark background by default.** Base background is `#111111`.
- **Use brand color tokens** defined in `tailwind.config.ts`. Do not use arbitrary hex values in className strings.
- **Large rounded cards.** Use `rounded-2xl` or larger for all card elements.
- **Bold typography.** Use large, legible font sizes suitable for children aged 7–14.
- **One primary action per screen.** Every screen must have a single, obvious call-to-action button.
- **Energy and play, not school.** The UI must not resemble a traditional educational dashboard. It must feel like a game.
- **Slay is the emotional center.** Include `SlayCharacter` as a visible, animated presence on key screens (map, mission, reward).
- **Reward screens must be celebration-focused.** Use the `RewardModal` component with coins, XP, and positive feedback.
- **Do not hardcode text content.** Mission text, vocabulary, and quiz content must come from the database via the service layer.
- **Implement as PWA.** Include a valid `manifest.json` and service worker. The app must be installable on mobile.
- Screens actually implemented (student-facing set below; teacher/admin consoles are
  separate multi-page areas, see [ux-ui-concepts.md](.agents/ux-ui-concepts.md) for
  the full current route inventory):
  - `WelcomeScreen` — still the landing screen for a signed-out visitor. Its
    primary action opens the signed-out demo map (`/demo`, see
    `src/features/demo/`) so the first thing they do is play; a secondary
    button goes to the login screen for someone who already has an account.
  - `OnboardingForm`
  - City map (`CityMap` with `MapLocationNode` nodes)
  - `MissionScreen` (task-type components under `src/features/mission/`, of which
    `VocabularyTask`, `MatchingTask`, `QuizTask` are only 3 of 30+)
  - `RewardModal` (modal) / `RewardScreen` (full-screen variant)
  - Wardrobe (`WardrobeGrid` — item cards render inline, no separate `WardrobeItemCard`)
  - Profile screen (with knowledge-level picker)
  - Homework screen (teacher-assigned topics, student side)
  - `ParentDashboard`
  - Teacher console (`TeacherDashboard`, groups, homework authoring, Q&A, map/mission
    preview)
  - Admin content screens (district/location/mission/task-type/wardrobe/teacher/admin
    /feedback management — not one single `AdminMissionEditor`)

---

## Do Not Build Yet

Do not implement any of the following in the MVP. File a note in the PR if you feel the temptation:

- Apple OAuth (Google OAuth is already implemented — `signInWithGoogle` in
  `src/features/auth/actions.ts` — do not re-propose it as future work)
- Magic-link sign-in (never actually implemented despite earlier docs claiming it was
  — no `signInWithOtp` call exists in the codebase)
- A real parent-managed student login flow (a parent creating login credentials for
  their child). Note this is distinct from parent↔student *linking*, which already
  exists: a parent connects to an already-registered student's profile via
  `link_student_by_email`.
- Real-time speech recognition or pronunciation scoring
- AI-powered adaptive personalization (personalized learning paths)
- Complex AI tutoring or conversational AI features
- Multiplayer or social features
- Leaderboards
- In-app purchases or payment processing
- Push notifications
- Multiple language support beyond English — **except the parent console and
  three parts of the student game**, translated (English / Ukrainian / Russian,
  see `src/features/i18n/`) on the product owner's request:
  - The whole parent console: a parent is an adult who never signed up to learn
    English. It follows the browser's `Accept-Language` by default.
  - The student's **profile screen and tab bar** only, switchable on their
    profile. The default is a fixed language (`STUDENT_DEFAULT_LOCALE`,
    currently English) rather than the browser's. Both consoles share one
    stored preference (the `slay_locale` cookie).
  - The **signed-out demo's own chrome** (`src/features/demo/`): its log-in bar
    and the sign-up wall behind it. A visitor has no profile to have chosen a
    language on, so this follows the browser like the parent console does
    (`resolveBrowserLocale`).

  Everything a mission puts on screen stays English — the English *is* the
  lesson — as does all authored content (district, location, mission and
  homework titles, vocabulary) and the knowledge-level names.
- Additional district content beyond the MVP test set
- Advanced analytics dashboards
- Any feature that does not directly serve the loop: `Map → Mission → Reward → Unlock → Return Tomorrow`

---

## Architecture Decisions

- **Next.js App Router** is the routing and rendering model. Use Server Components by default; opt into Client Components only when interactivity or browser APIs are required.
- **Supabase is the entire backend.** Do not introduce a separate Node.js/Express backend. Privileged server logic runs either as a Postgres `SECURITY DEFINER` RPC function (the default choice, e.g. `complete_mission`, `purchase_wardrobe_item`) or, when the service-role client or Deno runtime is genuinely needed, a Supabase Edge Function (currently only `update-streak`). Next.js Server Actions (`"use server"`) are the client-facing entry point that calls into these.
- **PostgreSQL via Supabase** is the only database. Do not introduce additional databases or ORMs.
- **Supabase Auth** handles all authentication (email/password + Google OAuth today; no magic link, no Apple OAuth). Do not introduce third-party auth providers (NextAuth, Clerk, etc.) without permission.
- **OpenRouter API** (not OpenAI) powers AI generation: `google/gemini-2.5-flash-image` for admin/teacher art (district/location/task images, teacher vocabulary flashcards), and `google/gemini-2.5-flash` for teacher homework content drafting (grammar/vocabulary JSON). It is called exclusively from Next.js Server Actions — `src/features/admin/` (`openRouterImage.ts` and its callers, gated by `requireAdmin`) and `src/features/teacher/` (`openRouterChat.ts` and its callers, gated by `requireTeacher`). It is never called from the browser.
- **Four roles, not three**: `student`, `parent`, `admin`, `teacher`. The `teacher` role was added after the original MVP and is promotion-only (an admin flips an existing account's role via `promote_teacher()`; there is no service-role key in this project to create accounts from scratch).
- **Vercel** hosts the Next.js frontend. **Supabase Cloud** hosts all backend services.
- **Tailwind CSS** is the only styling solution. No CSS-in-JS, no Styled Components, no Sass.
- **Storybook** documents shared UI primitives and select feature components (`.stories.tsx`/`.mdx` files); it is a dev-time tool, not part of the CI pipeline.
- **As-built:** there is a single environment in practice — the app develops directly against the remote Supabase project (see project memory on verifying authed pages / applying migrations remotely). CI pushes migrations straight to that production database on every merge to `main` (see `.github/workflows/ci.yml`, `migrate` job) — there is no separate staging gate. Treat every migration merged to `main` as immediately live.
- **CI/CD via GitHub Actions** runs lint → type-check → unit tests (Vitest) → build check on every push/PR, then auto-applies pending migrations to production on `main`.
- All secrets live in **Vercel Environment Variables** and **Supabase Secrets** only.

---

## What Not to Change Without Permission

- The brand color palette (`#FF2D8E`, `#9DFF00`, `#00F0FF`, `#6A00FF`, `#111111`, `#FFFFFF`).
- The names of the required database tables listed in the Database section.
- The names of the required RPC/action operations (`complete_mission`/`submitMissionCompletion`, `purchase_wardrobe_item`/`purchaseWardrobeItem`, etc. — see [api-architecture.md](.agents/api-architecture.md) and [backend.md](.agents/backend.md) for the current full inventory).
- The names of the required core components (`CityMap`, `SlayCharacter`, `RewardModal`, etc. — see [frontend.md](.agents/frontend.md) for current file locations).
- The core product loop: `Map → Mission → Reward → Unlock → Return Tomorrow`.
- The decision to process all reward and progress mutations server-side.
- The decision to call OpenRouter exclusively from Next.js Server Actions (never OpenAI, never from the browser).
- The four-role system: `student`, `parent`, `teacher`, `admin` — and the rule that `teacher` accounts are promotion-only.
- The Supabase + Vercel hosting architecture.
- RLS policies on any user-related table — do not disable or weaken them.

---

## After Completing Work, You MUST

1. Run `npm run lint` and fix all errors before committing.
2. Run `npm run type-check` and fix all TypeScript errors before committing.
3. Run `npm run test` and confirm all tests pass.
4. Run `npm run build` and confirm the build succeeds without errors.
5. Regenerate Supabase types (`npx supabase gen types typescript`) if you changed the database schema, and commit the updated `src/types/supabase.ts`.
6. Confirm no secrets, API keys, or credentials appear anywhere in the committed diff.
7. Confirm no XP, coin, streak, or unlock logic was added to client-side code.
8. Confirm all new user-related tables have RLS enabled.
9. Confirm all new screens are mobile-first and use only the defined brand color tokens.
10. Write a PR description that states: what you built, which part of the core loop it serves, and any deviations from this manual with justification.
11. If the work is being merged, follow [Git and Release Workflow](#git-and-release-workflow) to the end — green CI, squash merge, and a verified Production deploy. A merged PR is not a shipped change until Vercel reports the new commit in Production.
