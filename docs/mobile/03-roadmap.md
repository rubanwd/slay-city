# Roadmap

Nine phases, M0 → M8. Each has a hard exit criterion; a phase is not done because
its code exists, it is done because its criterion is demonstrably met on a real
device.

## Overview

| Phase | Name | Eng. days | Calendar | Gate |
| --- | --- | --- | --- | --- |
| **M0** | Foundations — monorepo, shared packages | 5 | wk 1 | Web still green on Vercel |
| **M1** | Mobile shell — Expo, routing, design system | 5 | wk 2 | App opens on a real phone |
| **M2** | Auth & session | 5.5 | wk 3 | Sign in, reset, refresh all work natively |
| **M3** | Student core loop — map → mission → reward | 10 | wk 4–5 | A mission completes and pays out |
| **M4** | Student surround — homework, wardrobe, profile, … | 7 | wk 6–7 | Student app feature-complete |
| **M5** | Teacher & parent consoles | 11 | wk 7–9 | All three roles usable |
| **M6** | Polish — animation, audio, offline, performance | 7 | wk 9–10 | 60 fps on a low-end Android |
| **M7** | Store readiness — accounts, compliance, builds | 5 + wait | wk 10–12 | Builds accepted for review |
| **M8** | Beta, review, launch | — | wk 12–14 | Live in both stores |

**~55 engineering days. ~12–14 calendar weeks to launch**, of which 2–4 weeks is
store review latency you cannot compress.

Everything before M7 is work I can do in this repository. M7 and M8 need you: Apple
and Google accounts, physical devices, and legal text with your name on it.

## Dependency graph

```
M0 ──┬── M1 ── M2 ──┬── M3 ── M4 ──┐
     │              │              ├── M6 ── M7 ── M8
     └── WP-2.3 ────┴───── M5 ─────┘
         (RLS audit)

WP-7.1 (dev accounts) ─── start at M0, needed by M7
OD-1, OD-2 answered ───── needed by M4, M2
```

Two things must start earlier than their phase:

- **WP-7.1 — Apple and Google developer accounts.** Apple's verification can take
  days to weeks for an organisation (D-U-N-S lookup). Start it in week 1, not week 10.
- **WP-2.3 — the teacher RLS audit.** It gates all of M5 and is the one piece of
  work where being wrong means a security hole rather than a bug.

## Parallelisation

The work packages in [04-work-packages.md](04-work-packages.md) are sized for
independent agents. Safe concurrency:

| Phase | Parallel tracks |
| --- | --- |
| M0 | 1 — everything else imports these packages |
| M1 | 2 — design-system primitives ‖ navigation skeleton |
| M3 | 3 — map ‖ mission tiers 1–2 ‖ mission tiers 3–4 |
| M4 | 4 — homework ‖ wardrobe+profile ‖ onboarding+levels ‖ feedback+i18n |
| M5 | 2 — teacher ‖ parent |
| M6 | 3 — animation ‖ audio+haptics ‖ offline+perf |

M3's mission work is the best parallelisation target: 32 independent components with
a shared `TaskRunner` contract. Freeze that contract first (`WP-3.2`), then fan out.

---

## M0 — Foundations
**5 days · no dependencies · start immediately**

Convert the repository to npm workspaces and extract the shared packages, with the
web app continuing to build and deploy the whole time.

- `WP-0.1` Workspace skeleton, root `package.json`, `git mv src → apps/web/src`
- `WP-0.2` `packages/core` — extract the pure modules listed in migration map §1
- `WP-0.3` `packages/data` — extract queries, inject the Supabase client
- `WP-0.4` `packages/tokens` — palette, type scale, shared Tailwind preset
- `WP-0.5` CI matrix over workspaces; Vercel root directory → `apps/web`

**Exit:** `npm run lint`, `type-check`, `test`, `build` all pass at the root; a
Vercel preview deploy of `apps/web` is byte-for-byte equivalent in behaviour; zero
`packages/**` file imports React or Next.

> This is the riskiest *boring* phase. It touches every import path in the project.
> Do it in one focused PR, not spread across others.

## M1 — Mobile shell
**5 days · needs M0**

- `WP-1.1` Expo app scaffold, TypeScript, NativeWind, path aliases to the packages
- `WP-1.2` Nunito via `expo-font`; typography components matching `typography.css`
- `WP-1.3` Design-system primitives: `SlayButton`, `SlayCard`, `Section`, `Grid`,
  `AppContainer`, `ScrollScreen`, `ProgressBar`, `CurrencyAmount`, `StreakBadge`
- `WP-1.4` Icons to `react-native-svg`
- `WP-1.5` Expo Router skeleton with role groups and placeholder screens
- `WP-1.6` Portrait lock, splash screen, app icon, dark `#111111` base

**Exit:** the app installs on a physical iPhone and a physical Android phone via
Expo Go or a dev build, navigates between placeholder screens, and a side-by-side
screenshot of the primitives against the web app is approved.

## M2 — Auth & session
**5.5 days · needs M1 · needs OD-2 answered**

- `WP-2.1` Supabase client with SecureStore adapter, `AppState` auto-refresh
- `WP-2.2` Login, register, forgot-password, reset-password screens
- `WP-2.3` **Teacher/parent RLS audit** and any new `SECURITY DEFINER` RPCs
- `WP-2.4` Deep links: scheme, `slaycity://auth/callback`, Supabase allow-list
- `WP-2.5` Google OAuth via `expo-auth-session`; Sign in with Apple if OD-2(a)
- `WP-2.6` Root-layout route guard driven by `roleHome()` from core

**Exit:** a real account signs in on both platforms; the session survives an app
restart and a 24-hour gap; a password-reset email opens the app at the right screen;
each of the four roles lands on its own home.

## M3 — Student core loop
**10 days · needs M2**

The loop `Map → Mission → Reward → Unlock` is the product. Nothing else matters if
this does not feel good.

- `WP-3.1` City map: background, location nodes, mascot marker, pan/zoom
- `WP-3.2` `TaskRunner` contract + `MissionScreen` shell — **freeze before fan-out**
- `WP-3.3` Tier 1 tasks — 21 components
- `WP-3.4` Tier 2 tasks — 6 components
- `WP-3.5` Tier 3 tasks — 3 components, native keyboard handling
- `WP-3.6` Tier 4 — `WordSearchTask`, `SnakeGameTask`
- `WP-3.7` Reward screen and modal, celebration animation

**Exit:** on a physical device, a student opens the map, completes one mission of
every one of the 32 task types, sees the reward, and the XP/coins in Supabase match
what the web app grants for the same mission.

## M4 — Student surround
**7 days · needs M3 · needs OD-1, OD-7 answered**

- `WP-4.1` Homework: topic list, vocabulary flow, grammar flow, word audio
- `WP-4.2` Wardrobe: grid, purchase, equip, mascot rendering
- `WP-4.3` Profile, level picker, username editing
- `WP-4.4` Onboarding
- `WP-4.5` Study-time tracker with `AppState`-aware heartbeat
- `WP-4.6` Feedback with `expo-image-picker`
- `WP-4.7` i18n: locale in SecureStore, `LocalePicker`, tab-bar labels

**Exit:** every student-facing route in the migration map §3 exists and works; the
student app is feature-complete against the web app.

## M5 — Teacher & parent consoles
**11 days · needs M2 and WP-2.3 · needs OD-1 answered**

- `WP-5.1` Teacher dashboard, groups, student cards
- `WP-5.2` Homework topic authoring
- `WP-5.3` `VocabularyManager` — the largest single component at 632 LOC
- `WP-5.4` `GrammarManager`
- `WP-5.5` Q&A messaging
- `WP-5.6` AI drafting against the new Edge Functions (skip if OD-1(b))
- `WP-5.7` View-as-student mode, without cookies
- `WP-5.8` `ParentDashboard` — progress, streaks, study time, homework summary
- `WP-5.9` Parent profile, student linking, parent map view

**Exit:** a teacher authors a topic on a phone and a student receives it; a parent
sees that student's progress update.

## M6 — Polish
**7 days · needs M4 and M5 · needs OD-4, OD-5, OD-6 answered**

- `WP-6.1` The eight keyframes as Reanimated hooks
- `WP-6.2` Audio via `expo-audio`; `hiss`, `sfx`, mission sounds
- `WP-6.3` Haptics on rewards, correct answers, level unlocks
- `WP-6.4` Offline: TanStack Query persistence at the depth chosen in OD-5
- `WP-6.5` Performance pass — list virtualisation, image caching, memoisation
- `WP-6.6` Accessibility — labels, dynamic type, contrast
- `WP-6.7` Error boundaries, crash reporting, empty and offline states

**Exit:** 60 fps on a low-end Android device (target: a 2–3-year-old mid-range
phone) through map, mission and reward; app launches to interactive in under 2 s on
that device.

## M7 — Store readiness
**5 engineering days + 2–4 weeks of waiting · needs M6**

- `WP-7.1` Apple Developer ($99/yr) and Google Play ($25 once) accounts — **start in
  week 1**
- `WP-7.2` EAS Build and EAS Submit configuration, signing credentials
- `WP-7.3` Bundle identifiers, versioning, release channels
- `WP-7.4` Privacy policy, terms, data-safety and privacy-nutrition declarations
- `WP-7.5` Kids-compliance work per OD-3: parental gate, analytics decision
- `WP-7.6` Store listings: screenshots, descriptions, keywords, age ratings
- `WP-7.7` Internal testing builds — TestFlight and Play internal track

**Exit:** builds are uploaded, pass automated checks, and are submitted for review.

## M8 — Beta and launch
**Calendar-bound, not effort-bound**

- `WP-8.1` Closed beta with real students, teachers and parents
- `WP-8.2` Fix what the beta finds
- `WP-8.3` Submit, answer reviewer questions, resubmit
- `WP-8.4` Staged rollout, then full release
- `WP-8.5` Post-launch: OTA update workflow, crash monitoring

**Exit:** live in both stores.

---

## What happens to the web app

It keeps running, unchanged in behaviour, throughout. After M0 it imports its logic
from `packages/core` and `packages/data` instead of from `src/features/*`, which is
an internal refactor with no user-visible effect.

From M8 onward you maintain two front ends against one backend. Budget for it: a new
student-facing feature is roughly 1.6× the work it is today — the shared logic is
written once, the two screens are not. Features confined to the admin console cost
exactly what they cost now.
