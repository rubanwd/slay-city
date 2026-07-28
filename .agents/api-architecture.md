# API Architecture

The API is organized around Supabase client queries plus Next.js Server Actions
(`"use server"` files colocated per feature, e.g. `src/features/mission/actions.ts`).
Most mutations call a Postgres `SECURITY DEFINER` RPC function rather than a
Supabase Edge Function — see [backend.md](backend.md) for which is which.
There is no populated `src/services/` layer (the directory exists but is an empty
`.gitkeep` stub); data-fetching and mutation code lives inside each
`src/features/<name>/` directory, either inline in server components or in a
feature-local `queries.ts`.

There are no centralized `getProfile`/`getDistricts`/etc. functions — reads are done
inline where needed, or via named functions scattered across each feature's
`queries.ts` (e.g. `parent/queries.ts::getParentProgressSummary`,
`teacher/queries.ts::getTeacherGroups`, `demo/queries.ts::getDemoDistrict`,
`levels/queries.ts::getAvailableLevels`, `study/queries.ts::getStudyTimeSummary`,
`feedback/queries.ts::getUnreadFeedbackCount`, `homework/qa/queries.ts::getTopicMessages`).

Server actions, by feature directory (`src/features/<name>/actions.ts` unless noted):

```txt
admin       — createMission, updateMission, publishMission, unpublishMission,
              deleteMission, createMissionTask, updateMissionTask, deleteMissionTask,
              publishMissionTask, unpublishMissionTask, updateTaskTypeTemplate,
              publishTaskType, unpublishTaskType, addAdminEmail, removeAdminEmail,
              promoteTeacher, revokeTeacher, createTeacherGroup, deleteTeacherGroup,
              addGroupMember, removeGroupMember, createDistrict, updateDistrict,
              reorderDistricts, createLocation, updateLocation, deleteDistrict,
              deleteLocation, createWardrobeItem, updateWardrobeItem,
              publishWardrobeItem, unpublishWardrobeItem, deleteWardrobeItem
              (plus generateLocationIcon.ts, generateMapBackground.ts,
              generateTaskImage.ts, missionImageActions.ts — AI art generation,
              all requireAdmin-gated)
auth        — signUp, signIn, signInWithGoogle, googleFormAction, signOut,
              loginFormAction, registerFormAction, requestPasswordReset,
              forgotPasswordFormAction, updatePassword, resetPasswordFormAction
demo        — completeDemoMission, restartDemo
feedback    — submitFeedbackReport, markAllFeedbackRead, deleteFeedbackReport
homework    — completeHomeworkVocab, completeHomeworkGrammar
homework/qa — postTopicMessage, markTopicRead, deleteTopicMessage
i18n        — setLocalePreference
levels      — restartMyLevel, changeMyLevel
map         — moveLocationOnMap
mission     — submitMissionCompletion, resetMissionProgress, resetLocationProgress
              (there is no startMission/submitMissionAnswer — the flow is a single
              completion call to the complete_mission RPC, plus a streak update via
              the update-streak Edge Function)
onboarding  — createProfile
study       — recordStudyTime
teacher     — createHomeworkTopic, updateHomeworkTopic, deleteHomeworkTopic
              (plus grammarActions.ts, vocabularyActions.ts, viewAsActions.ts for
              AI-drafted homework content and admin "view as teacher" impersonation)
wardrobe    — purchaseWardrobeItem, equipWardrobeItem, unequipWardrobeItem
```

API rules:

* All API responses must be typed.
* All important actions must be validated server-side.
* The client must not directly modify XP, coins, streaks, or unlocked locations.
* OpenRouter API calls (image generation via `google/gemini-2.5-flash-image`, and text
  drafting via `google/gemini-2.5-flash` for teacher homework content) must happen only
  inside Next.js Server Actions, never in the browser.
* Admin APIs must be role-protected (`requireAdmin`); teacher APIs via `requireTeacher`
  (which also accepts an admin currently impersonating a teacher).
