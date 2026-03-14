# Ping

**Event matching platform that connects compatible attendees through questionnaire-based matching.**

Live: [https://pingv2-pink.vercel.app](https://pingv2-pink.vercel.app)

## What it does

Ping is a B2B SaaS tool sold to event hosts. Attendees fill out a short questionnaire before the event (no app download, no account required), and the matching engine delivers their top connections at event start.

1. Host creates an event, sets questions, weights, and match count
2. Attendees scan a QR code and complete the questionnaire
3. Host closes responses and runs matching
4. Matches appear on each attendee's confirmation page in real time

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Supabase |
| ORM | Drizzle ORM |
| Auth | Supabase Auth (hosts only) |
| UI | Tailwind CSS + shadcn/ui |
| Deployment | Vercel |

## Local setup

```bash
# 1. Create a Supabase project and copy credentials
cp .env.example .env.local

# 2. Install dependencies
npm install

# 3. Push schema to DB
npm run db:push

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type check

npm run db:generate  # Generate Drizzle migration files
npm run db:migrate   # Run pending migrations
npm run db:push      # Push schema directly (dev only)
npm run db:studio    # Open Drizzle Studio
```

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
```
