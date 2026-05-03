// Seed script — creates a realistic open event with attendees ready to match.
// Usage: npm run db:seed -- <host-email>
//
// Sign up at http://localhost:3000/login first, then run this script.

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../lib/db/schema";
import { randomUUID } from "crypto";

const { events, questions, attendees, responses } = schema;

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run db:seed -- <host-email>");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !serviceKey || !databaseUrl) {
  console.error("Missing env vars. Make sure .env.local is populated.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);
const db = drizzle(databaseUrl, { schema });

// ── Find host ────────────────────────────────────────────────────────────────

const { data, error } = await supabase.auth.admin.listUsers();
if (error) { console.error("Supabase error:", error.message); process.exit(1); }

const host = data.users.find((u) => u.email === email);
if (!host) {
  console.error(`No user found with email: ${email}`);
  console.error("Sign up at http://localhost:3000 first, then re-run this script.");
  process.exit(1);
}

console.log(`\nSeeding for host: ${host.email} (${host.id})\n`);

// ── Event ────────────────────────────────────────────────────────────────────

const [event] = await db
  .insert(events)
  .values({
    hostId: host.id,
    name: "Startup Mixer – Spring 2025",
    description: "A curated networking event for founders, investors, and operators in the Bay Area.",
    matchCount: 3,
    matchingMode: "general",
    status: "open",
  })
  .returning();

console.log(`✓ Event created: ${event.name} (${event.id})`);

// ── Questions ────────────────────────────────────────────────────────────────

const [q1, q2, q3] = await db
  .insert(questions)
  .values([
    {
      eventId: event.id,
      text: "What stage is your company?",
      type: "single_choice",
      options: ["Idea / pre-product", "Pre-seed", "Seed", "Series A+", "No company — I'm investing or advising"],
      weight: 8,
      order: 0,
    },
    {
      eventId: event.id,
      text: "What are you most hoping to get out of tonight?",
      type: "multiple_choice",
      options: ["Find a co-founder", "Meet investors", "Find customers", "Give or get mentorship", "Explore partnerships"],
      weight: 10,
      order: 1,
    },
    {
      eventId: event.id,
      text: "How technical are you? (1 = purely business, 10 = deep engineering)",
      type: "scale",
      scaleMin: 1,
      scaleMax: 10,
      weight: 5,
      order: 2,
    },
  ])
  .returning();

console.log(`✓ 3 questions created`);

// ── Attendees + responses ─────────────────────────────────────────────────────

type AttendeeInput = {
  name: string;
  email: string;
  q1: string;
  q2: string[];
  q3: number;
};

const people: AttendeeInput[] = [
  { name: "Priya Sharma",    email: "priya@example.com",    q1: "Seed",                               q2: ["Meet investors", "Find customers"],                   q3: 7 },
  { name: "James Okafor",    email: "james@example.com",    q1: "No company — I'm investing or advising", q2: ["Meet investors", "Explore partnerships"],        q3: 4 },
  { name: "Sofia Reyes",     email: "sofia@example.com",    q1: "Pre-seed",                           q2: ["Find a co-founder", "Give or get mentorship"],        q3: 9 },
  { name: "Marcus Tran",     email: "marcus@example.com",   q1: "Series A+",                          q2: ["Find customers", "Explore partnerships"],             q3: 6 },
  { name: "Aisha Patel",     email: "aisha@example.com",    q1: "Idea / pre-product",                 q2: ["Find a co-founder", "Give or get mentorship"],        q3: 8 },
  { name: "Tom Lindqvist",   email: "tom@example.com",      q1: "No company — I'm investing or advising", q2: ["Meet investors", "Give or get mentorship"],      q3: 3 },
  { name: "Chloe Kim",       email: "chloe@example.com",    q1: "Seed",                               q2: ["Meet investors", "Find customers", "Explore partnerships"], q3: 5 },
  { name: "Ravi Menon",      email: "ravi@example.com",     q1: "Pre-seed",                           q2: ["Find a co-founder", "Meet investors"],                q3: 9 },
];

for (const person of people) {
  const token = randomUUID();
  const [attendee] = await db
    .insert(attendees)
    .values({ eventId: event.id, name: person.name, email: person.email, token })
    .returning();

  await db.insert(responses).values([
    { attendeeId: attendee.id, questionId: q1.id, value: person.q1 },
    { attendeeId: attendee.id, questionId: q2.id, value: person.q2 },
    { attendeeId: attendee.id, questionId: q3.id, value: person.q3 },
  ]);
}

console.log(`✓ ${people.length} attendees seeded with responses`);

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Seed complete!

  Host dashboard:   http://localhost:3000/dashboard
  Event page:       http://localhost:3000/events/${event.id}
  Questionnaire:    http://localhost:3000/e/${event.id}

  Next steps:
    1. Open the event page and review the attendee responses
    2. Close the event and run matching to see results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
