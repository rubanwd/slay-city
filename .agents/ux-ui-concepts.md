# UX/UI Concepts

The visual style of SLAY CITY is based on a bright, modern, game-like design with Slay as the emotional center of the product.

The UI should feel energetic, playful, motivational, and safe for children. It should not look like a traditional school platform or boring educational dashboard.

The main visual direction includes:

* Dark background
* Neon pink accents
* Lime green action elements
* Cyan and purple highlights
* Large rounded cards
* Bold typography
* Reward-focused screens
* Character-driven interface

Primary brand colors (defined as RGB-channel CSS vars in `src/styles/theme.css`,
consumed via `rgb(var(--color-x) / <alpha-value>)` so Tailwind opacity modifiers work):

```txt
Neon Pink:   #FF2D8E
Lime Green:  #9DFF00
Cyan:        #00F0FF
Purple:      #6A00FF
Neon Orange: #FF8A00   (added later — not in the original palette)
Black:       #111111
White:       #FFFFFF
```

Semantic aliases also exist on top of these: `--color-background`, `--color-foreground`,
`--color-accent` (= pink), `--color-highlight` (= lime).

The screens have grown well beyond the original MVP set — the app now has ~20+ routes
across four roles, not 8 screens:

```txt
# Student
Welcome screen (signed-out) → opens the no-login demo (/demo) as the primary action
Onboarding screen
City map screen
Mission screen (30+ task types)
Reward screen
Wardrobe screen
Profile screen (+ level picker)
Homework screen (teacher-assigned topics, if in a group)

# Guest (no login)
Demo map + demo mission (/demo, /demo/mission)

# Parent
Parent dashboard (/parent), map view, profile

# Teacher
Teacher dashboard, groups, homework topic authoring + Q&A, read-only map/mission
preview, profile (/teacher/*)

# Admin
Districts, locations, missions, task types, wardrobe, teachers, admins, users,
feedback inbox (/admin/*) — several multi-page consoles, not one flat "admin content
screen". /admin/users is the account list: username, email, join date, role change
and account deletion.
```

The UX must always be simple, mobile-first, and child-friendly for the student-facing
screens specifically. Each screen should have one clear primary action. Admin and
teacher consoles are utility screens for adults and can be denser, but should not be
allowed to leak that "dashboard" feel into any student-facing screen.

The app is a real installable PWA: `public/manifest.json` + `public/sw.js`, registered
via a `ServiceWorkerRegistration` component in `src/app/layout.tsx`, alongside device-
chrome components (`InstallPrompt`, `AudioUnlock`, `MediaGuard`, `PortraitLock`).
