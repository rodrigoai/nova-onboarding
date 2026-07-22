# Nova Onboarding

Internal fiscal onboarding workspace for companies that use nova.money. It includes company and tenant setup, PostgreSQL persistence, and AI-assisted chart-of-accounts creation merged with each tenant's live Nova Money structure.

## Stack

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS 4
- Supabase Postgres, Data API, Auth, and Row Level Security
- `@supabase/ssr` cookie-based sessions
- Vercel-ready server actions
- OpenAI Responses API with schema-validated outputs
- AES-256-GCM encryption for certificate passwords and Nova Money keys

## Local setup

1. Copy `.env.example` to `.env` and add the Supabase project URL and publishable key.
2. Generate an encryption key with `openssl rand -base64 32` and set `APP_ENCRYPTION_KEY`.
3. Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` (defaults to `gpt-5.6-terra`). Never prefix the API key with `NEXT_PUBLIC_`.
4. Open the Supabase SQL Editor and run the SQL files in `supabase/migrations` in filename order.
5. In Supabase Authentication, create at least one user allowed to access the workspace.
6. Install and start the app:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Vercel deployment

1. Import this repository into Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the Vercel production and preview environments.
3. Add `APP_ENCRYPTION_KEY` as a production and preview environment variable. Keep the same key while encrypted records exist.
4. Add `OPENAI_API_KEY` and `OPENAI_MODEL` as server-only environment variables.
5. Apply the SQL migration from `supabase/migrations` in the Supabase SQL Editor.
6. Create authorized users under Supabase Authentication and deploy.

## Security note

Certificate passwords and Nova Money keys are encrypted before storage. OpenAI and Nova Money calls execute only on the server, and secret values are never returned by the chart-of-accounts actions. In development only, when no encryption key is supplied, stored tenant secrets use an explicit development-only representation. Production saves fail if the encryption key is missing.

The `companies` table has Row Level Security enabled. Anonymous access is revoked; authenticated Supabase users can read and manage records. The publishable key is public by design and does not bypass these policies. Control workspace membership through Supabase Authentication.
