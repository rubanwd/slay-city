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

# Apply database migrations
npx supabase db push

# Generate TypeScript types from the database schema
npx supabase gen types typescript --local > src/types/supabase.ts

# Deploy an Edge Function
npx supabase functions deploy <function-name>
```

> If these scripts are not yet defined in `package.json`, add them before executing. Never run a command that could mutate production data unless explicitly authorized.

---

## Project Structure Rules

Follow this directory layout exactly. Do not create top-level directories outside this structure without permission.

```
src/
  app/              # Next.js App Router pages and layouts
  components/       # Shared, reusable UI primitives (+ Storybook stories/docs)
  features/         # Feature-scoped modules (map, mission, wardrobe, parent, admin, auth, onboarding, profile, reward)
  hooks/            # Custom React hooks
  lib/              # Third-party client instances (Supabase client, etc.)
  types/            # TypeScript types and generated Supabase types
  styles/           # Global styles and Tailwind config extensions

supabase/
  functions/        # Supabase Edge Functions — as-built, this is just update-streak
  migrations/       # Ordered SQL migration files
```

> **As-built deviation:** there is no `src/services/` layer. Each
> `src/features/<feature-name>/` directory owns its own `actions.ts`
> (Next.js Server Actions, `"use server"`) that talks to Supabase directly —
> either a plain table query or `supabase.rpc(...)` against a Postgres
> `SECURITY DEFINER` function in `supabase/migrations/`. Follow that pattern
> for new features rather than reintroducing a `services/` layer.

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
- Required core components to implement (do not rename or split arbitrarily):
  - `WelcomeScreen`, `OnboardingForm`, `CityMap`, `MapLocationNode`, `SlayCharacter`
  - `MissionScreen`, `VocabularyTask`, `MatchingTask`, `QuizTask`
  - `RewardModal`, `ProgressBar`, `StreakBadge`
  - `WardrobeGrid`, `WardrobeItemCard`
  - `ParentDashboard`, `AdminMissionEditor`

### Brand Colors
Always use the defined brand tokens. Do not use arbitrary color values.

| Token | Hex |
|---|---|
| Neon Pink | `#FF2D8E` |
| Lime Green | `#9DFF00` |
| Cyan | `#00F0FF` |
| Purple | `#6A00FF` |
| Black | `#111111` |
| White | `#FFFFFF` |

Configure these in `tailwind.config.ts` under `theme.extend.colors` and reference them by name.

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
- Cover all game-state mutation paths (completeMission, purchaseWardrobeItem, equipWardrobeItem, updateStreak) with tests that verify server-side validation is enforced.

Test file convention: colocate `*.test.ts` next to the module it covers
(e.g. `src/features/map/mapState.test.ts`, `supabase/functions/update-streak/index.test.ts`).
Edge Function logic that needs unit tests should be split into a
dependency-free module (see `update-streak/streak.ts`) so it can run under
Vitest/Node instead of only the Deno runtime.

---

## MVP Scope

The MVP must prove one hypothesis: **students are motivated to return daily, complete short English missions, and progress through the city.**

### Include in MVP
- User registration and login (email/password and magic link)
- Role assignment: `student`, `parent`, `admin`
- City map screen showing unlocked, current, completed, and locked locations
- Daily mission flow: vocabulary → matching → listening → mini quiz
- Reward screen after mission completion (XP, coins)
- Basic streak tracking
- Wardrobe screen for Slay customization (view and equip owned items)
- Parent dashboard: completed missions, daily streaks, vocabulary learned, map progress
- Admin content screen: create/edit districts, locations, missions, vocabulary; generate and approve AI content; publish/unpublish missions
- Progressive Web App manifest and service worker

### Core API Operations to Implement
**Read:** `getProfile`, `getDistricts`, `getLocations`, `getMissions`, `getMissionDetails`, `getVocabularyItems`, `getUserProgress`, `getUserStats`, `getWardrobeItems`, `getOwnedWardrobeItems`, `getParentProgressSummary`

**User Actions:** `createProfile`, `startMission`, `submitMissionAnswer`, `completeMission`, `purchaseWardrobeItem`, `equipWardrobeItem`

**Admin Actions:** `createDistrict`, `updateDistrict`, `createLocation`, `updateLocation`, `createMission`, `updateMission`, `createVocabularyItem`, `createMissionTask`, `publishMission`, `unpublishMission`, `generateMissionContent`, `approveGeneratedContent`

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
Implement all of the following tables. Do not rename them:

| Table | Purpose |
|---|---|
| `profiles` | Student profile data (incl. `level`, the knowledge level being studied) |
| `districts` | City districts, each belonging to one knowledge `level` |
| `locations` | Map locations inside districts |
| `missions` | Learning missions connected to locations |
| `vocabulary_items` | English words, translations, images, audio, examples |
| `mission_tasks` | Task steps (vocabulary, matching, listening, quiz) |
| `user_progress` | Completed missions and unlocked progress |
| `user_stats` | XP, coins, level, current streak, longest streak |
| `wardrobe_items` | Available Slay accessories |
| `user_wardrobe_items` | Purchased or unlocked accessories per user |
| `achievements` | Achievement definitions |
| `user_achievements` | Achievements unlocked by a user |
| `ai_content_drafts` | AI-generated content pending review |
| `admin_emails` | Allowlist of emails permitted to self-claim the admin role (`claim_admin` RPC) |
| `parent_student_links` | Links a parent account to student profile(s) (`link_student_by_email` RPC) |
| `task_type_templates` | Default config per task type, used by the admin Task Types configurator/tester |
| `study_time_daily` | Seconds a student spent on learning screens, bucketed per UTC day (`record_study_time` RPC) |

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
- All reward and progress mutations must go through named server-side functions: `complete_mission`, `purchase_wardrobe_item`, `equip_wardrobe_item`, `unequip_wardrobe_item` (Postgres `SECURITY DEFINER` RPCs) and `updateStreak` (the one actual Edge Function). Never grant the client direct UPDATE/INSERT on the underlying tables.
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
- Required screens for MVP (implement all of these):
  - `WelcomeScreen`
  - `OnboardingForm`
  - City map (`CityMap` with `MapLocationNode` nodes)
  - `MissionScreen` (with `VocabularyTask`, `MatchingTask`, `QuizTask`)
  - `RewardModal`
  - Wardrobe (`WardrobeGrid` with `WardrobeItemCard`)
  - `ParentDashboard`
  - Admin content screen (`AdminMissionEditor`)

---

## Do Not Build Yet

Do not implement any of the following in the MVP. File a note in the PR if you feel the temptation:

- Google OAuth or Apple OAuth
- Parent-managed student login flow
- Real-time speech recognition or pronunciation scoring
- AI-powered adaptive personalization (personalized learning paths)
- Complex AI tutoring or conversational AI features
- Multiplayer or social features
- Leaderboards
- In-app purchases or payment processing
- Push notifications
- Multiple language support beyond English — **except the parent console and two
  parts of the student game**, translated (English / Ukrainian / Russian, see
  `src/features/i18n/`) on the product owner's request:
  - The whole parent console: a parent is an adult who never signed up to learn
    English. It follows the browser's `Accept-Language` by default.
  - The student's **profile screen and tab bar** only, defaulting to Ukrainian
    (`STUDENT_DEFAULT_LOCALE`) and switchable on their profile. Both consoles
    share one stored preference (the `slay_locale` cookie).

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
- **Supabase Auth** handles all authentication. Do not introduce third-party auth providers (NextAuth, Clerk, etc.) without permission.
- **OpenRouter API** (not OpenAI) powers AI image generation (`google/gemini-2.5-flash-image`, for admin district/location art). It is called exclusively from Next.js Server Actions in `src/features/admin/` (`openRouterImage.ts` and its callers), gated by `requireAdmin`. It is never called from the browser.
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
- The names of the required API operations (`completeMission`, `purchaseWardrobeItem`, etc.).
- The names of the required core components (`CityMap`, `SlayCharacter`, `RewardModal`, etc.).
- The core product loop: `Map → Mission → Reward → Unlock → Return Tomorrow`.
- The decision to process all reward and progress mutations server-side.
- The decision to call OpenAI exclusively from Edge Functions.
- The three-role system: `student`, `parent`, `admin`.
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
