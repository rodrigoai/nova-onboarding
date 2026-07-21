# Nova Onboarding

Internal fiscal onboarding workspace for companies that use nova.money. It includes a four-step form, PostgreSQL persistence, list/search/type filters, a copy-friendly detail view, editing, and deletion.

## Stack

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS 4
- Supabase Postgres, Data API, Auth, and Row Level Security
- `@supabase/ssr` cookie-based sessions
- Vercel-ready server actions
- AES-256-GCM encryption for certificate passwords

## Local setup

1. Copy `.env.example` to `.env` and add the Supabase project URL and publishable key.
2. Generate an encryption key with `openssl rand -base64 32` and set `APP_ENCRYPTION_KEY`.
3. Open the Supabase SQL Editor and run `supabase/migrations/20260721190000_create_companies.sql`.
4. In Supabase Authentication, create at least one user allowed to access the workspace.
5. Install and start the app:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Vercel deployment

1. Import this repository into Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the Vercel production and preview environments.
3. Add `APP_ENCRYPTION_KEY` as a production and preview environment variable. Keep the same key while encrypted records exist.
4. Apply the SQL migration from `supabase/migrations` in the Supabase SQL Editor.
5. Create authorized users under Supabase Authentication and deploy.

## Security note

Certificate passwords are encrypted before storage. In development only, when no encryption key is supplied, they use an explicit development-only representation. Production saves fail if the key is missing.

The `companies` table has Row Level Security enabled. Anonymous access is revoked; authenticated Supabase users can read and manage records. The publishable key is public by design and does not bypass these policies. Control workspace membership through Supabase Authentication.
