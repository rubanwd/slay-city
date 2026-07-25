This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Auth emails (signup confirmation & password reset)

The app only asks Supabase to send these emails — Supabase does the sending, so
a missing email is almost always project configuration, not app code. Checklist
when "reset password does nothing / no email arrives":

1. **Custom SMTP must be enabled** (Supabase Dashboard → Project Settings →
   Auth → SMTP Settings). The built-in email service is for development only:
   it delivers to project members' addresses, silently drops everything else,
   and is capped at a few emails per hour. Real users need a provider (Resend,
   SendGrid, Postmark, …).
2. **Rate limits** (Auth → Rate Limits → "Emails sent per hour"). Repeated
   reset attempts hit this quickly; the API still returns success, so the UI
   shows "a reset link has been sent" while nothing goes out.
3. **`NEXT_PUBLIC_SITE_URL`** must be set on the deployment to the public site
   URL (no trailing slash). Reset and confirmation links are built from it.
4. **Redirect allow-list** (Auth → URL Configuration) must contain
   `${NEXT_PUBLIC_SITE_URL}/auth/callback` (a wildcard such as
   `https://example.com/auth/callback*` covers the `?next=` variants), and Site
   URL must be the production URL. A `redirectTo` that isn't allow-listed is
   replaced by the Site URL, which is how reset links end up pointing at
   `localhost`.
5. The address must belong to an existing user. `/auth/forgot-password`
   deliberately reports the same message either way so accounts can't be
   enumerated, so an unknown or OAuth-only address looks identical to a sent
   email.

Locally, `npx supabase start` captures all auth emails in Inbucket
(http://127.0.0.1:54324) — nothing leaves the machine.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
