# Frontend

The frontend should be built with Next.js, React, TypeScript, and Tailwind CSS.

Frontend responsibilities:

* Render the PWA user interface
* Display the city map
* Display unlocked, completed, current, and locked locations
* Handle mission screens
* Display vocabulary and quiz tasks
* Show reward screens
* Display user XP, coins, and streak
* Render Slay wardrobe and equipped items
* Display parent progress dashboard
* Display admin content management screens

Suggested frontend structure:

```txt
src/
  app/
  components/
  features/
  hooks/
  lib/
  services/
  types/
  styles/
```

Core frontend components:

```txt
WelcomeScreen
OnboardingForm
CityMap
MapLocationNode
SlayCharacter
MissionScreen
VocabularyTask
MatchingTask
QuizTask
RewardModal
ProgressBar
StreakBadge
WardrobeGrid
WardrobeItemCard
ParentDashboard
AdminMissionEditor
```

Frontend rules:

* Do not hardcode learning content in the frontend.
* Do not calculate final rewards on the client.
* Do not update XP, coins, streaks, or unlocks directly from the browser.
* Use reusable UI components.
* Keep all screens mobile-first.
* Follow the SLAY CITY visual style and color palette.
