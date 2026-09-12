# Risks and Compliance

Ordered by how much of the project they can cost. Every entry names a mitigation and
the work package that carries it.

## R1 — Teacher writes lose their server-side guard 🔴 critical

Five action files perform 32 direct table writes and rely on `requireTeacher()`
running on a server the user does not control. React Native has no such server. If
these ship as direct client writes and RLS does not already forbid them, any signed-in
student could author homework for any group, or post Q&A messages as a teacher.

**Mitigation:** `WP-2.3` — audit every write, wrap what RLS does not cover in a
`SECURITY DEFINER` RPC that re-checks the role in SQL, and prove it with negative
tests using a student JWT. Do this in M0/M2, not when M5 starts.

**If the audit finds the web app is already exposed** — because RLS was never the
thing stopping these writes — that is a production incident, not a migration finding.
Stop and report it.

## R2 — Sign in with Apple 🟠 high

App Store Review Guideline 4.8 requires an equivalent privacy-preserving login
option whenever an app offers third-party social login. SLAY CITY offers Google
(`signInWithGoogle`). The root `AGENTS.md` lists Apple OAuth under **Do Not Build
Yet**.

This is a hard requirement, not a recommendation, and it is a common cause of first
rejection. The cheap escape is hiding Google on iOS — but then an account created
with Google on the web cannot sign in on an iPhone at all, which is worse.

**Mitigation:** answer `OD-2` before M2. Recommendation: implement it.

## R3 — Kids privacy: COPPA, GDPR-K, and the two families programmes 🟠 high

Onboarding accepts ages from 5. That puts the app squarely inside children's privacy
law in both stores, and both stores enforce it at review.

| | Apple | Google |
| --- | --- | --- |
| Programme | Kids Category (optional) | Designed for Families (mandatory if children are a target audience) |
| Third-party analytics | Prohibited in the Kids Category | Restricted; must be disclosed |
| Parental gate | Required before external links, purchases, or leaving the app | Required for the same |
| Age declaration | Age rating questionnaire | Target-audience and content declaration |

The app already loads Google Analytics through `@next/third-parties`. In an Apple
Kids Category build, that is a rejection.

**Mitigation:** `OD-3` and `OD-4`. Recommendation: stay out of the Kids Category,
rate 4+, and keep analytics — a smaller discovery loss than the compliance burden.
Google's Families requirements apply either way and must be answered honestly.
`WP-7.5`.

## R4 — The M0 workspace conversion breaks the live web app 🟠 high

`WP-0.1` touches every import path in a production application that students use
today. A broken Vercel deploy here is a live outage, not a failing test.

**Mitigation:** one focused PR, nothing else in it. Verify on a Vercel preview before
merging — map, a full mission, the teacher console and the admin console. Keep the
previous deployment one click from rollback. Do not stack M1 work on the branch.

## R5 — Two front ends, forever 🟡 medium, permanent

After launch, every student-facing feature is built twice. Shared logic is written
once; the screens are not. Expect roughly **1.6× the effort** for new student-facing
work, and no change at all for admin-only work.

**Mitigation:** this is the price of native, not a defect. Keep the layer rules in
[01-architecture.md](01-architecture.md) §1 enforced by lint, so logic cannot leak
into a screen and get duplicated. The more that lives in `packages/core`, the closer
the multiplier gets to 1.

## R6 — Store review latency 🟡 medium

Typical first review: 1–3 days on Apple, a few days to two weeks on Google for a new
developer account, longer for anything aimed at children. A rejection resets the
clock. Two to three rounds is normal for a kids' education app.

**Mitigation:** `WP-7.1` starts in week 1. Submit to TestFlight and the Play internal
track early — internal distribution surfaces most metadata problems before the real
review. Budget 2–4 weeks of calendar, and do not promise a launch date that assumes
first-time approval.

## R7 — Map layout does not translate 🟡 medium

`CityMap` positions nodes absolutely against a background image. The web can lean on
viewport units and CSS transforms; React Native cannot, and phone aspect ratios vary
far more than the 390 pt design target suggests.

**Mitigation:** `WP-3.1` — derive positions from measured layout, test at 390 pt,
428 pt, a 20:9 Android and a tablet. The node coordinates are database values shared
with the web, so they must stay proportional, not be re-tuned for one device.

## R8 — Timers and background state 🟡 medium

`SnakeGameTask`, the Tier 2 timed tasks and `StudyTimeTracker` all run intervals.
On the web a backgrounded tab is throttled by the browser. On a phone nothing
throttles them: the app keeps ticking, drains battery, records study time for a
pocket, and desyncs game state.

**Mitigation:** one shared `useAppStateAwareInterval` hook, used by every timer.
`WP-3.4`, `WP-3.6`, `WP-4.5`.

## R9 — OpenRouter key in the bundle 🔴 critical if mishandled

A mobile binary is not a secret store. `OPENROUTER_API_KEY` shipped in an `.ipa` or
`.aab` is extractable in minutes and bills to your account.

**Mitigation:** the key never enters `apps/mobile`. AI generation goes through Edge
Functions (`OD-1`). `WP-5.6` includes an explicit acceptance check: grep the built
binary for the key and for `openrouter.ai`.

## R10 — Text input on native 🟢 low, but noticeable

iOS and Android keyboards autocorrect, autocapitalise and suggest spellings by
default. In `SpellingBeeTask` the keyboard will offer the answer.

**Mitigation:** `WP-3.5` — explicit input configuration per task, verified on both
platforms with a real keyboard, not a simulator's hardware keyboard.

## R11 — Emoji rendering 🟢 low

`EmojiText.tsx` uses `@twemoji/api`, which parses DOM nodes and swaps in images.
It cannot run in React Native.

**Mitigation:** use the platform's native emoji font. Accept that emoji will look
different on iOS, Android and the web. If visual consistency matters to the brand,
bundle Twemoji as image assets and map codepoints — a day of work, deferrable.

## R12 — Deep-link allow-list regression 🟢 low, high impact

Adding `slaycity://` to the Supabase redirect allow-list means editing a setting the
live web app depends on. Removing or replacing a web URL breaks password reset in
production silently — the API still returns success, as the root `README.md` already
documents.

**Mitigation:** `WP-2.4` — add, never replace. Verify a web password reset
immediately after the change.

---

## Compliance checklist for M7

- [ ] Privacy policy live, reachable, and specific about what children's data is collected
- [ ] Terms of service live
- [ ] Apple privacy nutrition labels completed against actual behaviour
- [ ] Google Play data-safety form completed against actual behaviour
- [ ] Age rating questionnaires completed on both stores
- [ ] Parental gate implemented if entering the Apple Kids Category
- [ ] Account deletion available in-app — required by both stores where accounts can be created
- [ ] Sign in with Apple, or no third-party login on iOS
- [ ] No third-party analytics if in the Kids Category
- [ ] Google Families policy declarations complete
- [ ] Support URL and contact address live
- [ ] Screenshots for every required device size
