# Frontend

The frontend is built with Next.js (App Router), React, TypeScript, and Tailwind CSS.

Frontend responsibilities:

* Render the PWA user interface (manifest at `public/manifest.json`, service worker at
  `public/sw.js`, registered from `src/app/layout.tsx`)
* Display the city map, including unlocked, completed, current, and locked locations
* Handle mission screens across 30+ task types (vocabulary, matching, quiz, snake game,
  crossword, hangman, word search, spelling bee, and more — see `src/features/mission/`)
* Show reward screens
* Display user XP, coins, and streak
* Render Slay wardrobe and equipped item (one equipped at a time)
* Display the parent progress dashboard (progress, streaks, study time, homework summary)
* Display the teacher console (groups, students, homework authoring, Q&A, map/mission
  review preview)
* Display student homework screens (teacher-assigned vocabulary/grammar topics)
* Display the signed-out demo (guest can play one random district with no login)
* Handle in-app feedback/bug reporting
* Localize the parent console, student profile/tab-bar, and demo chrome (see
  `src/features/i18n/`) — the mission/learning content itself always stays English
* Display admin content management screens

Actual top-level structure:

```txt
src/
  app/            # Next.js App Router pages and layouts
  components/     # shared/global UI primitives + a few cross-feature screens
  features/       # feature-scoped modules (16 directories, see below)
  hooks/          # small shared hooks (currently just useImageLoaded.ts)
  lib/            # Supabase client, audio/sfx helpers
  middleware.ts
  services/       # EXISTS but is an empty .gitkeep stub — do not put code here without
                  # first confirming with the user; the working pattern is a
                  # feature-local actions.ts/queries.ts (see below)
  stories/        # leftover Storybook/CRA-init boilerplate (Button/Header/Page) — not
                  # real app code
  styles/         # globals.css, theme.css, typography.css
  types/          # database.ts (generated), index.ts (domain types)
```

`src/features/` directories (16, not the originally-scoped 8):

```txt
admin      — admin console: districts/locations/missions/task-types/wardrobe/teachers
             /admins/feedback CRUD, AI image generation
auth       — login/register/forgot/reset-password forms, role-based post-login routing
demo       — no-login guest demo (random district reveal, demo mission, demo progress)
feedback   — in-app feedback widget + admin inbox/unread badge
homework   — student-facing consumption of teacher-assigned grammar/vocabulary topics
i18n       — locale picker, message catalogs, cookie-based locale resolution
levels     — knowledge-level picker + "locked levels" messaging
map        — CityMap, MapLocationNode, MascotMarker, map state/constants
mission    — the task-type library (30+ components) + MissionScreen/TaskRunner/ProgressBar
onboarding — OnboardingForm + actions
parent     — ParentDashboard, ParentProfileScreen, homework-oversight queries
profile    — student ProfileScreen, ProfileLevelCard
reward     — RewardScreen (full post-mission reward screen)
study      — study-time heartbeat/telemetry (no screen of its own)
teacher    — TeacherDashboard, group/student management, grammar & vocabulary content
             managers, "view as teacher" impersonation
wardrobe   — wardrobe actions/categories/mascot-cookie logic (WardrobeGrid itself
             lives in src/components/wardrobe/, not here)
```

Core frontend components — real names/locations (several moved or split since first
documented; do not assume the original flat list is current):

```txt
WelcomeScreen      — src/components/WelcomeScreen.tsx
OnboardingForm     — src/features/onboarding/OnboardingForm.tsx
CityMap            — src/features/map/CityMap.tsx (+ CityMapPreview.tsx for teacher review)
MapLocationNode    — src/features/map/MapLocationNode.tsx
SlayCharacter      — src/components/ui/SlayCharacter.tsx (has its own Storybook story)
MissionScreen      — src/components/mission/MissionScreen.tsx
VocabularyTask, MatchingTask, QuizTask — src/features/mission/ (3 of 30+ task types)
RewardModal        — src/components/ui/RewardModal.tsx (a modal; distinct from the
                     full-screen src/features/reward/RewardScreen.tsx)
ProgressBar        — exists in two places: src/components/ui/ProgressBar.tsx and
                     src/features/mission/ProgressBar.tsx
StreakBadge        — src/components/ui/StreakBadge.tsx
WardrobeGrid        — src/components/wardrobe/WardrobeGrid.tsx
WardrobeItemCard   — does NOT exist as a separate component; WardrobeGrid renders
                     item cards inline
ParentDashboard    — src/features/parent/ParentDashboard.tsx
AdminMissionEditor — does NOT exist under that name; split into AdminMissionForm.tsx +
                     AdminMissionItem.tsx, part of a larger admin-form family
                     (AdminDistrictForm/Header/List, AdminLocationForm/Header/Item,
                     AdminTaskForm/Item/ContentFields/TypeConfigurator,
                     AdminWardrobeForm/Item, …) in src/features/admin/
```

Frontend rules:

* Do not hardcode learning content in the frontend.
* Do not calculate final rewards on the client.
* Do not update XP, coins, streaks, or unlocks directly from the browser.
* Use reusable UI components.
* Keep all screens mobile-first.
* Follow the SLAY CITY visual style and color palette (see [UX/UI Concepts](ux-ui-concepts.md)).
