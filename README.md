# Togly

**Event matching platform that connects compatible attendees through questionnaire-based matching.**

Live: [https://pingv2-pink.vercel.app](https://pingv2-pink.vercel.app)

## What it does

Togly is a B2B SaaS tool sold to event hosts. Attendees fill out a short questionnaire before the event (no app download, no account required), and the matching engine pairs them with their most compatible connections at event start.

1. Host creates an event, sets questions, weights, and match count
2. Attendees scan a QR code or open a link and complete the questionnaire
3. Host closes responses and runs matching from the event dashboard
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

## Requirements

- **Node.js 22+** — run `nvm use` if you have nvm installed
- A [Supabase](https://supabase.com) project (free tier works)

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env vars and fill them in (see .env.example for where to find each value)
cp .env.example .env.local

# 3. Push the schema to your database
npm run db:push

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up for a host account.

## Seed data (optional but recommended)

Populate a realistic open event with 8 attendees and responses so you can explore the full host flow immediately:

```bash
# Sign up at http://localhost:3000/login first, then:
npm run db:seed -- your@email.com
```

This creates a "Startup Mixer" event in `open` status with 3 mixed-type questions and 8 attendees with varied responses — ready to close and run matching.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type check

npm run db:generate  # Generate Drizzle migration files from schema changes
npm run db:migrate   # Run pending migrations
npm run db:push      # Push schema directly to DB (dev only, skips migration files)
npm run db:studio    # Open Drizzle Studio — visual DB browser
npm run db:seed      # Seed a sample event for local development
```

## Environment variables

See `.env.example` for setup instructions. All four are required:

```
NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Public anon key (safe to expose in browser)
SUPABASE_SERVICE_ROLE_KEY      # Secret — server-side only, never expose publicly
DATABASE_URL                   # Transaction pooler connection string (port 6543)
```

## What's not built yet

- **SMS delivery** — matching results are shown on the web confirmation page; Twilio integration for SMS is not implemented (`delivered` status is a no-op)
- **Feedback form** — `/f/[token]` route is a skeleton only
- **Attendee group assignment UI** — two-sided matching (investors ↔ founders) is supported in the schema and engine, but there's no UI to assign attendees to groups
- **Match trigger UI** — the matching API exists (`POST /api/events/[id]/match`) but triggering it from the host dashboard UI is not wired up
