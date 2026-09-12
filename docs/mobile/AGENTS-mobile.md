# AGENTS-mobile.md — SLAY CITY Mobile Operating Manual

The React Native counterpart of the root `AGENTS.md`. Everything in the root manual
still applies — product loop, brand palette, database rules, security rules, the
four-role system. This document adds what is specific to `apps/mobile`, and
overrides the root manual only where it says so explicitly.

## Development commands

```bash
npm install                      # root — installs all workspaces
npm run lint -w apps/mobile
npm run type-check -w apps/mobile
npm run test -w apps/mobile
npx expo start                   # from apps/mobile
npx expo run:ios | run:android   # dev build on a device
eas build --profile preview      # cloud build, no Mac required
```

## Layer rules — enforced by lint, not by convention

| Package | May import | Must never import |
| --- | --- | --- |
| `@slay/core` | TypeScript stdlib only | React, React Native, Next.js, `@supabase/*` |
| `@slay/data` | `@slay/core`, `@supabase/supabase-js` types | React, React Native, Next.js |
| `@slay/tokens` | nothing | everything |
| `apps/mobile` | all packages, Expo | `next/*`, anything from `apps/web` |

**If a piece of logic could be needed by the web app, it goes in `@slay/core`.**
Reward maths, unlock rules, validation, puzzle generation, i18n, streak logic — all
core, never a screen. A screen renders and dispatches. It does not decide.

## Structure

```
apps/mobile/
├── app/                  # Expo Router — routes only, thin
│   ├── _layout.tsx       # session, fonts, audio, splash, route guard
│   ├── (auth)/ (student)/ (teacher)/ (parent)/
├── src/
│   ├── components/ui/    # design-system primitives
│   ├── components/layout/
│   ├── features/         # mirrors apps/web/src/features, screens only
│   ├── animations/       # one hook per web keyframe, same name
│   ├── hooks/
│   └── lib/              # supabase client, secure storage, audio adapter
└── assets/               # fonts, icons, splash, sounds
```

Route files stay thin: resolve params, call a hook, render a feature component.
No data fetching and no business logic inside `app/`.

## Styling

- NativeWind v4 with the shared preset from `@slay/tokens`. Class names first.
- Drop to `StyleSheet` only where NativeWind genuinely cannot express it — measured
  layouts, animated styles.
- **Never a raw hex value.** The six brand colours are locked by the root manual.
- `rounded-2xl` or larger on cards.
- Design at 390 pt. Verify at 428 pt, a 20:9 Android, and a tablet.
- Every screen wraps in `SafeAreaView` or uses safe-area insets. A notch eating the
  primary action is a bug.
- Touch targets at least 44×44 pt.

## Animation

- `react-native-reanimated` only. Nothing on the JS thread.
- Animate `transform` and `opacity`. Animating `width`, `height` or `top` triggers
  layout on every frame.
- One hook per web keyframe in `src/animations/`, keeping the web's name
  (`useGlowPulse`, `useLoaderBob`, …) so the two platforms stay comparable.
- Slay is the emotional centre — the mascot is present and alive on map, mission and
  reward screens, as the root manual requires.

## State and data

- Server state: TanStack Query. Never `useEffect` + `useState` for a fetch.
- `invalidateQueries` replaces the web's `revalidatePath`.
- Credentials in `expo-secure-store`. Preferences in `AsyncStorage`. Never the
  reverse — session tokens are credentials.
- Every data call goes through `@slay/data` with the mobile client injected. A screen
  never writes a raw `.from()` query.

## Security — non-negotiable

- **No XP, coin, streak or unlock logic in the app.** Rewards come from
  `complete_mission()` and nowhere else. A mobile binary is fully readable by its
  user; anything the client could decide, a user could forge.
- **No secrets in the bundle.** No `OPENROUTER_API_KEY`, no service-role key, ever.
  The anon key is public by design and is the only key allowed.
- Privileged work happens in a `SECURITY DEFINER` RPC or an Edge Function that
  re-checks the caller's role in SQL. A client-side role check is a UX affordance,
  never an authorisation.
- Any new direct table write needs an RLS policy that would stop a hostile client,
  and a negative test proving it does.

## Timers and app lifecycle

Use the shared `useAppStateAwareInterval` hook for every interval. A phone does not
throttle a backgrounded app the way a browser throttles a hidden tab: an unmanaged
timer drains battery, records study time for a pocket, and desyncs game state.

Audio stops on background. The study heartbeat stops on background. Game loops pause
and resume without losing state.

## Mission tasks

- Every task implements the frozen `TaskProps` contract from `WP-3.2`.
- A task reports outcomes. It never computes a reward.
- Content comes from the database. Never hardcode mission text, vocabulary or quiz
  content — this is a root-manual rule and it applies identically here.
- Text-input tasks configure `autoCorrect`, `autoCapitalize` and `spellCheck`
  explicitly. A spelling exercise whose keyboard suggests the answer is broken.

## Language

Per the root manual, and unchanged on mobile: mission content, authored content and
knowledge-level names stay **English** — the English is the lesson. Translated
surfaces are the parent console in full, and on the student side only the profile
screen and the tab bar.

## Definition of done

Root manual items 1–10 still apply, plus:

1. `npm run lint`, `type-check` and `test` pass for `apps/mobile`.
2. Verified on a **physical iOS device and a physical Android device** — not only a
   simulator. Simulators lie about performance, keyboards, safe areas and haptics.
3. Tested at 390 pt and at least one other width.
4. No new raw hex colours; brand tokens only.
5. No business logic added to `apps/mobile` that the web would also need.
6. No secrets in the diff; if the package touches an API key, the built binary was
   grepped for it.
7. Screenshots attached to the PR for any visual change.
8. New timers use `useAppStateAwareInterval`.
9. Accessibility labels on new interactive elements.

## What not to change without permission

Everything in the root manual's list, plus:

- The layer rules above — they are what keeps one product from becoming two.
- The frozen `TaskProps` contract.
- The decision that `apps/mobile` holds no secrets.
- The choice of Expo managed workflow. Ejecting to bare React Native is a one-way
  door that gives up EAS Build's Mac-free iOS builds.
