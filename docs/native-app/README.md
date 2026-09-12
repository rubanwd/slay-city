# SLAY CITY Native — Planning Set

Planning documents for `slay-city-native`: a **separate repository** holding the
native iOS and Android build of SLAY CITY, seeded from a snapshot of the current web
app and developed independently of it.

`rubanwd/slay-city` stays in production, unchanged, throughout.

These files are written to be copied into the new repository as its `docs/` folder.
[`seed/`](seed/) holds the code that ships with them.

Read in this order:

| Doc | What it answers |
| --- | --- |
| [CONCEPT.md](CONCEPT.md) | What is being built, why a separate repository, how the two repos and one Supabase project fit together |
| [SYNC.md](SYNC.md) | The shared-logic contract — the cost of two repositories, and the plan for keeping it bounded |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Repository layout, layer rules, where the backend boundary moves, auth, design system |
| [MIGRATION-MAP.md](MIGRATION-MAP.md) | Where every existing file ends up — the mechanical inventory |
| [ROADMAP.md](ROADMAP.md) | Phases M0–M8, exit criteria, dependencies, cross-repository work |
| [WORK-PACKAGES.md](WORK-PACKAGES.md) | 54 atomic, agent-executable tasks with acceptance criteria |
| [RISKS.md](RISKS.md) | Store review, kids-privacy law, drift, and the technical risks that can sink a phase |
| [AGENTS.md](AGENTS.md) | Operating manual for the native repository |
| [work-packages.json](work-packages.json) | The same plan, machine-readable: phases, dependency edges, owners, open decisions |

## Estimate at a glance

54 work packages, **54.5 engineering days**, ~12–14 calendar weeks to launch — of
which 2–4 weeks is store-review latency that cannot be compressed.

`work-packages.json` is the file to feed a planning agent.

## The three repositories

```
rubanwd/slay-city          rubanwd/slay-city-native
Next.js, live              Expo, iOS + Android
admin + all roles (web)    student · teacher · parent
OWNS supabase/             no supabase/ directory
         │                          │
         └────► one Supabase ◄──────┘
                one schema · one RLS set · 27 RPCs
```

The web repository owns the migration timeline. New RPCs and Edge Functions the
native app needs are opened as pull requests against it — never applied from here.

## Two findings that shaped the plan

Taken from a read of all 373 files, not from assumptions.

**None of the 32 mission task types needs drag gestures.** `WordSearchTask` selects
by tapping the first and last cell (`tapCell(r, c)`); the reorder-style tasks are
tap-to-select. That turns the mission port from bespoke gesture work into mostly
mechanical JSX translation.

**32 direct table writes depend on a `requireTeacher()` guard that cannot exist on a
phone.** Auditing them against RLS, and wrapping what RLS does not cover in
`SECURITY DEFINER` RPCs, is the one piece of work where being wrong means a security
hole rather than a bug. It gates the whole teacher console, so it starts in week 1.

## Baseline measurements

Taken from `rubanwd/slay-city` at commit `98327f5`, so later estimates can be checked
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
| Task types needing text input | 5 |
| Shared UI components | 38 files (~3 350 LOC) |
| Student-facing feature code | ~16 900 LOC |
| Teacher feature code | ~3 800 LOC |
| Parent feature code | ~1 220 LOC |
| Admin feature code (not ported) | ~9 400 LOC |
| Logic shared without rewriting | ~6 000 LOC, tests included |
| Files importing `next/link` or `next/navigation` | 35 |
| Server-only secrets | 1 — `OPENROUTER_API_KEY` |
