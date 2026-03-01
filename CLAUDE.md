# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `web/` (this directory):

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type check without building

npm run db:generate  # Generate Drizzle migration files from schema changes
npm run db:migrate   # Run pending migrations against DB
npm run db:push      # Push schema directly to DB (dev only, skips migration files)
npm run db:studio    # Open Drizzle Studio (visual DB browser)
```

No test suite exists yet.

## Tech Stack

Next.js 16 (App Router), TypeScript, PostgreSQL via Supabase, Drizzle ORM, Supabase Auth, Zod, Tailwind CSS 4, shadcn/ui, Vercel deployment.

## Architecture

### Route Structure

```
app/
  (host)/               — authenticated host routes; layout.tsx enforces auth + renders header
    dashboard/          — event list with attendee counts
    events/new/         — create event form
    events/[id]/        — event detail: status, stats, questionnaire link (CopyButton)
    events/[id]/questions/ — question builder (add/reorder/weight/delete)
  api/
    events/             — GET list, POST create (host-authed)
    events/[id]/        — GET, PATCH, DELETE (host-authed, owner-verified)
    events/[id]/responses/ — POST attendee submission (public, no auth)
    events/[id]/match/  — POST trigger matching engine (host-authed)
    events/[id]/matches/ — GET match results with attendee details (host-authed)
  auth/callback/        — Supabase OAuth code exchange
  login/                — host auth (magic link + password tabs)
  e/[token]/            — public attendee questionnaire; token is attendees.token (UUID)
  e/[token]/done/       — post-submission confirmation
  f/[token]/            — post-event feedback (STUBBED — Sprint 5)
```

### Key Lib Files

- `lib/db/schema.ts` — Full Drizzle schema: events, groups, questions, attendees, responses, matches, feedback
- `lib/matching/engine.ts` — Pure matching algorithm (`runMatchingEngine`), no framework dependencies
- `lib/matching/similarity.ts` — Per-type scoring: exact match (single_choice), Jaccard (multiple_choice), normalized distance (scale)
- `lib/supabase/middleware.ts` — Session refresh + redirects unauthenticated requests to `/login`
- `lib/validators/event.ts` — Zod schemas for event + question CRUD
- `lib/validators/response.ts` — Zod schema for attendee submission

### Custom Components

- `app/(host)/events/[id]/questions/question-builder.tsx` — Client component; drag-reorder, weight slider, add/delete questions
- `app/e/[token]/questionnaire-form.tsx` — Client component; renders single_choice/multiple_choice/scale inputs + contact fields

## Database Schema

**Enums:** `event_status` (draft→open→closed→matched→delivered), `matching_mode` (general | two_sided), `question_type` (single_choice | multiple_choice | scale)

**Key tables:**
- `events` — owned by `hostId` (Supabase auth UUID); `matchCount` (1-10), `matchingMode`, `status`, `deliveryTime`
- `groups` — for two-sided matching (e.g. investors ↔ founders); `matchWithId` self-references another group
- `questions` — `type`, `options` (jsonb), `scaleMin/Max`, `weight` (1-10), `order`
- `attendees` — `token` (UUID, unique) used in public URLs `/e/[token]`; `groupId` (optional)
- `responses` — `value` (jsonb) holds `string | string[] | number` depending on question type
- `matches` — `score` (0.0-1.0), `rankForA`, `rankForB`
- `feedback` — `rating` (positive | negative) linked to a match + attendee

## Event Status Lifecycle

`draft` → questions editable, no attendee submissions allowed
`open` → attendees can submit questionnaire
`closed` → submissions stopped, ready to run matching
`matched` → matching engine has run, results in `matches` table
`delivered` → SMS sent to attendees (Twilio — not yet implemented)

## Authentication

- **Magic link**: email → Supabase OTP → `/auth/callback?code=...` → session → `/dashboard`
- **Password**: standard email/password sign-in or sign-up, same callback
- Session stored in cookies; `lib/supabase/middleware.ts` refreshes on every request

## Server Actions Pattern

Form mutations use Next.js Server Actions (not API routes) for host-facing UI:
- `app/(host)/events/actions.ts` — `createEvent`, `openEvent`, `closeEvent`
- `app/(host)/events/[id]/questions/actions.ts` — `addQuestion`, `deleteQuestion`, `updateQuestionWeight`, `reorderQuestions`
- `app/login/actions.ts` — `signInWithMagicLink`, `signInWithPassword`, `signUpWithPassword`, `signOut`
- `app/e/[token]/actions.ts` — `submitQuestionnaire` (inserts attendee + all responses, then redirects to done)

Public attendee submission also goes through a server action (not the API route).

## Matching Engine

Input: questions (with weights), attendees (with response maps), matchCount, matchingMode
Algorithm: builds O(n²) pairwise matrix → weighted similarity sum → top-K per attendee → deduplication
Two-sided mode: only scores pairs with different `groupId` values
Output: `{ attendeeAId, attendeeBId, score, rankForA, rankForB }[]`

## What's Not Yet Implemented

- `/events/[id]/match` host page — API exists (`POST /api/events/[id]/match`, `GET /api/events/[id]/matches`) but no UI to trigger/view matching
- `/f/[token]` feedback form — skeleton only
- SMS delivery (Twilio) and `delivered` status transition
- Attendee group assignment UI (two-sided matching schema is ready, but no UI to assign attendees to groups)

## Environment

Requires `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL   # Supabase transaction pooler URL
```
