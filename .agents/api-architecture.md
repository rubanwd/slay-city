# API Architecture

The API is organized around Supabase client queries plus Next.js Server Actions
(`"use server"` files colocated per feature, e.g. `src/features/mission/actions.ts`).
Most mutations call a Postgres `SECURITY DEFINER` RPC function rather than a
Supabase Edge Function — see [backend.md](backend.md) for which is which.
There is no separate `src/services/` layer; data-fetching and mutation code
lives inside each `src/features/<name>/` directory.

Read operations:

```txt
getProfile
getDistricts
getLocations
getMissions
getMissionDetails
getVocabularyItems
getUserProgress
getUserStats
getWardrobeItems
getOwnedWardrobeItems
getParentProgressSummary
```

User actions:

```txt
createProfile
startMission
submitMissionAnswer
completeMission
purchaseWardrobeItem
equipWardrobeItem
```

Admin actions:

```txt
createDistrict
updateDistrict
createLocation
updateLocation
createMission
updateMission
createVocabularyItem
createMissionTask
publishMission
unpublishMission
generateMissionContent
approveGeneratedContent
```

API rules:

* All API responses must be typed.
* All important actions must be validated server-side.
* The client must not directly modify XP, coins, streaks, or unlocked locations.
* OpenRouter API calls (image generation) must happen only inside Next.js Server Actions, never in the browser.
* Admin APIs must be role-protected.
