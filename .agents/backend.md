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

As implemented, "backend function" mostly means a Postgres `SECURITY DEFINER`
RPC function (`supabase/migrations/`), invoked via `supabase.rpc(...)` from a
Next.js Server Action — not a Supabase Edge Function. The only real Edge
Function in the project is `update-streak` (`supabase/functions/update-streak/`).

Main backend functions:

```txt
complete_mission          — Postgres RPC (SECURITY DEFINER)
purchase_wardrobe_item    — Postgres RPC (SECURITY DEFINER)
equip_wardrobe_item       — Postgres RPC (SECURITY DEFINER)
unequip_wardrobe_item     — Postgres RPC (SECURITY DEFINER)
reset_location_progress   — Postgres RPC (SECURITY DEFINER)
updateStreak              — Supabase Edge Function
generateLocationIcon / generateMapBackground — Next.js Server Actions calling OpenRouter
```

Backend rules:

* Never trust the client for rewards or progress.
* All XP, coins, streaks, and unlocks must be processed server-side.
* OpenRouter API keys must never be exposed to the frontend (there is no OpenAI key in this project).
* User data must be protected with Row Level Security.
* Admin-only actions must be restricted by role (`requireAdmin` / `is_admin`).
