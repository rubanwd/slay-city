# Technical & Architecture

SLAY CITY should be built as a Progressive Web Application with a simple and scalable architecture.

Recommended stack:

```txt
Frontend: Next.js, React, TypeScript, Tailwind CSS
Backend: Supabase
Database: PostgreSQL
Authentication: Supabase Auth
Storage: Supabase Storage
Server logic: Supabase Edge Functions
AI: OpenAI API
Hosting: Vercel + Supabase Cloud
```

High-level architecture:

```txt
Next.js PWA
   ↓
Supabase Auth / Database / Storage / Edge Functions
   ↓
OpenAI API for AI-assisted content generation
```

The frontend is responsible for the user interface and user experience. The backend is responsible for authentication, data storage, progress tracking, reward validation, role permissions, and AI API calls.

AI must not be called directly from the browser. All OpenAI requests must go through secure backend functions.
