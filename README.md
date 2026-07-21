# Nova Onboarding

Internal fiscal onboarding workspace for companies that use nova.money. It includes a four-step form, PostgreSQL persistence, list/search/type filters, a copy-friendly detail view, editing, and deletion.

## Stack

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS 4
- Prisma ORM 7 with PostgreSQL
- Vercel-ready server actions
- AES-256-GCM encryption for certificate passwords

## Local setup

1. Copy `.env.example` to `.env` and add a PostgreSQL `DATABASE_URL`.
2. Generate an encryption key with `openssl rand -base64 32` and set `APP_ENCRYPTION_KEY`.
3. Install and prepare the database:

```bash
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`.

## Vercel deployment

1. Import this repository into Vercel.
2. Add a PostgreSQL provider from the Vercel Marketplace (Prisma Postgres, Neon, or Supabase) and connect it to the project so `DATABASE_URL` is available.
3. Add `APP_ENCRYPTION_KEY` as a production and preview environment variable. Keep the same key while encrypted records exist.
4. Apply migrations with `npm run db:deploy` against the production database.
5. Deploy. `postinstall` generates Prisma Client automatically.

## Security note

Certificate passwords are encrypted before storage. In development only, when no encryption key is supplied, they use an explicit development-only representation. Production saves fail if the key is missing. Before exposing the app outside a trusted network, add authentication and authorization at the application or Vercel level because the records contain sensitive fiscal data.
