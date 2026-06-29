# Backend

The backend should be built with Supabase.

Backend responsibilities:

* User authentication
* User profile management
* Mission content storage
* Vocabulary storage
* Progress tracking
* XP and coin management
* Daily streak logic
* Wardrobe ownership
* Parent dashboard data
* Admin content management
* AI content generation through secure backend functions

Backend must validate all important game-state changes.

Main backend functions:

```txt
completeMission
purchaseWardrobeItem
equipWardrobeItem
updateStreak
generateMissionContent
approveGeneratedContent
```

Backend rules:

* Never trust the client for rewards or progress.
* All XP, coins, streaks, and unlocks must be processed server-side.
* OpenAI API keys must never be exposed to the frontend.
* User data must be protected with Row Level Security.
* Admin-only actions must be restricted by role.
