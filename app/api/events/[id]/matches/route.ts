import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, matches, attendees, questions, responses } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { computeBreakdown } from "@/lib/matching/engine";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id: eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.hostId, user.id)));

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const attendeeA = alias(attendees, "attendeeA");
  const attendeeB = alias(attendees, "attendeeB");

  const matchResults = await db
    .select({
      id: matches.id,
      score: matches.score,
      rankForA: matches.rankForA,
      rankForB: matches.rankForB,
      attendeeA: {
        id: attendeeA.id,
        name: attendeeA.name,
        phone: attendeeA.phone,
      },
      attendeeB: {
        id: attendeeB.id,
        name: attendeeB.name,
        phone: attendeeB.phone,
      },
    })
    .from(matches)
    .innerJoin(attendeeA, eq(matches.attendeeAId, attendeeA.id))
    .innerJoin(attendeeB, eq(matches.attendeeBId, attendeeB.id))
    .where(eq(matches.eventId, eventId))
    .orderBy(matches.score);

  // Fetch questions for breakdown
  const eventQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.eventId, eventId))
    .orderBy(questions.order);

  // Fetch responses for all attendees involved in these matches
  const involvedIds = [
    ...new Set(matchResults.flatMap((m) => [m.attendeeA.id, m.attendeeB.id])),
  ];

  const eventResponses =
    involvedIds.length > 0
      ? await db
          .select()
          .from(responses)
          .where(inArray(responses.attendeeId, involvedIds))
      : [];

  // Build attendeeId → { questionId → value } map
  const responsesByAttendee: Record<string, Record<string, unknown>> = {};
  for (const r of eventResponses) {
    if (!responsesByAttendee[r.attendeeId]) responsesByAttendee[r.attendeeId] = {};
    responsesByAttendee[r.attendeeId][r.questionId] = r.value;
  }

  const breakdownQuestions = eventQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    weight: q.weight,
    scaleMin: q.scaleMin ?? 1,
    scaleMax: q.scaleMax ?? 10,
  }));

  const matchesWithBreakdown = matchResults.map((m) => ({
    ...m,
    breakdown: computeBreakdown(
      responsesByAttendee[m.attendeeA.id] ?? {},
      responsesByAttendee[m.attendeeB.id] ?? {},
      breakdownQuestions
    ),
  }));

  return NextResponse.json({ event, matches: matchesWithBreakdown });
}
