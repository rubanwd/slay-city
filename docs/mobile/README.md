# SLAY CITY — React Native / Expo Migration

Planning set for porting SLAY CITY from a Next.js PWA to native iOS and Android
apps built with Expo, while the web app stays live and in production.

Read in this order:

| Doc | What it answers |
| --- | --- |
| [01-architecture.md](01-architecture.md) | What the target system looks like, and which decisions still need the product owner's sign-off |
| [02-migration-map.md](02-migration-map.md) | Where every existing file ends up — the mechanical inventory |
| [03-roadmap.md](03-roadmap.md) | Phases M0–M8, their exit criteria, dependencies and calendar |
| [04-work-packages.md](04-work-packages.md) | Atomic, agent-executable tasks with acceptance criteria |
| [05-risks-and-compliance.md](05-risks-and-compliance.md) | Store review, kids-privacy law, and the technical risks that can sink a phase |
| [AGENTS-mobile.md](AGENTS-mobile.md) | Operating manual for the mobile app — the RN counterpart of the root `AGENTS.md` |

## Scope

**In:** student game, teacher console, parent console — as native iOS + Android apps.

**Out:** the admin console (`src/app/admin/**`, `src/features/admin/**`, ~9 400 LOC)
stays web-only. It is a content-authoring back office used from a laptop: dense
tables, image cropping, bulk edits. Porting it would add roughly a third to the
project for no user-visible gain.

**Unchanged:** Supabase stays the entire backend — same project, same schema, same
RLS, same 27 `SECURITY DEFINER` RPCs. The web app keeps running on Vercel.

## Estimate at a glance

54 work packages, **55.5 engineering days**, ~12–14 calendar weeks to launch —
of which 2–4 weeks is store-review latency that cannot be compressed.

`work-packages.json` carries the same plan in machine-readable form: phases,
packages, estimates, dependency edges, owners and the open decisions each one
blocks. It is the file to feed a planning agent.

## Baseline measurements

Taken from the repository at the time of planning, so later estimates can be checked
against something real.

| Metric | Value |
| --- | --- |
| TypeScript files under `src/` | 373 |
| Lines of TypeScript | ~41 950 |
| Client components (`"use client"`) | 135 |
| Server-action files (`"use server"`) | 26 (~3 960 LOC) |
| Distinct Supabase RPCs called | 27 |
| Mission task types | 32 (~4 070 LOC) |
| Task types needing drag gestures | **0** — every one is tap-driven |
| Task types needing text input | 5 (Crossword, FillBlank, SpellingBee, WordSearch, SnakeGame) |
| Shared UI components | 38 files (~3 350 LOC) |
| Student-facing feature code | ~16 900 LOC |
| Teacher feature code | ~3 800 LOC |
| Parent feature code | ~1 220 LOC |
| Admin feature code (not ported) | ~9 400 LOC |
| Files importing `next/link` or `next/navigation` | 35 |
| Server-only secrets | 1 — `OPENROUTER_API_KEY` |
