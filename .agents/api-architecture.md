# API Architecture

The API should be organized around Supabase client queries and Supabase Edge Functions.

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
* OpenAI API calls must happen only inside secure backend functions.
* Admin APIs must be role-protected.
