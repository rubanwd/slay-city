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
