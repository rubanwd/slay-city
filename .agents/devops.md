# DevOps

Frontend hosting should use Vercel.

Backend, database, storage, authentication, and serverless functions should use Supabase Cloud.

Recommended environments:

```txt
Development
Staging
Production
```

CI/CD should include:

```txt
Lint
Type check
Unit tests
Build check
Deployment
```

Recommended tools:

```txt
GitHub
GitHub Actions
Vercel
Supabase Cloud
Sentry
Vercel Analytics
Supabase Logs
```

Secrets must be stored only in environment variables:

```txt
Vercel Environment Variables
Supabase Secrets
```

No API keys, database credentials, or service tokens should be stored in the repository.

## As implemented

CI (`.github/workflows/ci.yml`) runs lint → type-check → unit tests (Vitest) →
build on every push/PR. On a push to `main` that passes CI, a second job
pushes pending `supabase/migrations/` straight to the **production** database
via `supabase db push --db-url ...` using the `SUPABASE_DB_PASSWORD` secret —
there is no separate staging gate. Be deliberate about what lands in
`supabase/migrations/` on `main`; there is no local/staging Supabase instance
in normal use, the app develops against the remote project directly.

Storybook (`npm run storybook`, `.storybook/`) is used as the component
catalogue for `src/components/ui` and several `src/features/*` components
(`.stories.tsx` + `.mdx` files) — not part of CI, but part of the dev workflow.
