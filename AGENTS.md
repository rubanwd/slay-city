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
  components/       # Shared, reusable UI primitives
  features/         # Feature-scoped modules (map, mission, wardrobe, parent, admin)
  hooks/            # Custom React hooks
  lib/              # Third-party client instances (Supabase client, etc.)
  services/         # Data-fetching and API abstraction layer
  types/            # TypeScript types and generated Supabase types
  styles/           # Global styles and Tailwind config extensions

supabase/
  functions/        # Supabase Edge Functions (one directory per function)
  migrations/       # Ordered SQL migration files
  seed.sql          # Seed data for development/staging
```

- Place feature-specific components inside `src/features/<feature-name>/components/`.
- Place feature-specific hooks inside `src/features/<feature-name>/hooks/`.
- Never put business logic directly inside `src/app/` page files — delegate to features or services.
- Never put Edge Function source code anywhere except `supabase/functions/`.
- Keep each file focused on a single responsibility.

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

- Write **unit tests** for all utility functions in `src/lib/` and `src/services/`.
- Write **unit tests** for all custom hooks in `src/hooks/` and `src/features/*/hooks/`.
- Write **integration tests** for all Supabase Edge Functions.
- Tests must pass before any PR is merged.
- CI/CD pipeline must include: lint → type-check → unit tests → build check.
- Do not merge code that introduces TypeScript errors or lint failures.
- Use a test runner compatible with the project setup (add Jest or Vitest if not already configured — document the choice in this file).
- Cover all game-state mutation paths (completeMission, purchaseWardrobeItem, equipWardrobeItem, updateStreak) with tests that verify server-side validation is enforced.

> Specific test file conventions (naming, location) must be added here once a test runner is confirmed.

---

## MVP Scope

The MVP must prove one hypothesis: **children are motivated to return daily, complete short English missions, and progress through the city.**

### Include in MVP
- User registration and login (email/password and magic link)
- Role assignment: `child`, `parent`, `admin`
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

- **Never expose the OpenAI API key to the frontend.** All OpenAI calls must go through Supabase Edge Functions.
- **Never expose Supabase service role keys to the frontend.** Use the anon key only in the browser.
- **Never store API keys, database credentials, or service tokens in the repository.** Use Vercel Environment Variables and Supabase Secrets.
- **Never trust the client for game-state changes.** XP, coins, streaks, and location unlocks must be computed and written server-side.
- **Never allow the browser to directly update** `user_stats`, `user_progress`, or `user_wardrobe_items` tables.
- Apply Row Level Security (RLS) to every user-related table. No exceptions.
- Enforce role checks on both frontend routes (redirect unauthorized users) and backend Edge Functions (reject unauthorized requests).
- Child users must only access their own profile and progress data.
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
| `profiles` | Child profile data |
| `districts` | City districts |
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

### Rules
- All user-related tables must have RLS enabled and appropriate policies defined.
- Admin content tables (`districts`, `locations`, `missions`, `vocabulary_items`, `mission_tasks`) must support `draft` and `published` states.
- Never write to reward-related columns (`xp`, `coins`, `streak`, `unlocked_locations`) from the client.
- All reward and progress mutations must go through named Edge Functions: `completeMission`, `purchaseWardrobeItem`, `equipWardrobeItem`, `updateStreak`.
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
- Parent-managed child login flow
- Real-time speech recognition or pronunciation scoring
- AI-powered adaptive personalization (personalized learning paths)
- Complex AI tutoring or conversational AI features
- Multiplayer or social features
- Leaderboards
- In-app purchases or payment processing
- Push notifications
- Multiple language support beyond English
- Additional district content beyond the MVP test set
- Advanced analytics dashboards
- Any feature that does not directly serve the loop: `Map → Mission → Reward → Unlock → Return Tomorrow`

---

## Architecture Decisions

- **Next.js App Router** is the routing and rendering model. Use Server Components by default; opt into Client Components only when interactivity or browser APIs are required.
- **Supabase is the entire backend.** Do not introduce a separate Node.js/Express backend. All server logic runs in Supabase Edge Functions (Deno runtime).
- **PostgreSQL via Supabase** is the only database. Do not introduce additional databases or ORMs.
- **Supabase Auth** handles all authentication. Do not introduce third-party auth providers (NextAuth, Clerk, etc.) without permission.
- **OpenAI API** is called exclusively from Supabase Edge Functions. It is never called from the browser or from Next.js API routes.
- **Vercel** hosts the Next.js frontend. **Supabase Cloud** hosts all backend services.
- **Tailwind CSS** is the only styling solution. No CSS-in-JS, no Styled Components, no Sass.
- **Three environments must exist:** Development, Staging, Production. Never test against Production.
- **CI/CD via GitHub Actions** runs lint → type-check → unit tests → build check on every PR.
- **Sentry** is used for error monitoring. **Vercel Analytics** and **Supabase Logs** for observability.
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
- The three-role system: `child`, `parent`, `admin`.
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
