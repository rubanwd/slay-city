# Technical & Architecture

SLAY CITY should be built as a Progressive Web Application with a simple and scalable architecture.

Stack as actually implemented:

```txt
Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS
Backend: Supabase (Postgres + Auth + Storage) fronted by Next.js Server Actions
Database: PostgreSQL
Authentication: Supabase Auth
Storage: Supabase Storage
Server logic: mostly Next.js Server Actions ("use server" files in src/features/*/actions.ts)
            calling Postgres SECURITY DEFINER RPC functions; a Supabase Edge
            Function is used only for update-streak (see backend.md)
AI: OpenRouter (google/gemini-2.5-flash-image) for admin art generation — not OpenAI
Dev/UI tooling: Storybook (component catalogue under src/components/ui, src/features/*)
Hosting: Vercel + Supabase Cloud
```

High-level architecture:

```txt
Next.js PWA
   ↓
Next.js Server Actions ("use server")
   ↓
Supabase (Postgres RPC / Auth / Storage) + one Edge Function (update-streak)
   ↓
OpenRouter API for AI-assisted image generation (admin only)
```

The frontend is responsible for the user interface and user experience. The backend is responsible for authentication, data storage, progress tracking, reward validation, role permissions, and AI API calls.

AI must not be called directly from the browser. All OpenRouter requests go through Next.js Server Actions (`src/features/admin/openRouterImage.ts` and its callers), gated by `requireAdmin`.
