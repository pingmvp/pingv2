import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, questions, attendees, responses, matches } from "@/lib/db/schema";
import { runMatchingEngine, type MatchAttendee } from "@/lib/matching/engine";
import { and, eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id: eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify host owns this event
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.hostId, user.id)));

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (event.status !== "closed") {
    return NextResponse.json(
      { error: "Event must be closed before matching" },
      { status: 400 }
    );
  }

  // Load questions
  const eventQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.eventId, eventId));

  // Load attendees
  const eventAttendees = await db
    .select()
    .from(attendees)
    .where(eq(attendees.eventId, eventId));

  if (eventAttendees.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 attendees to run matching" },
      { status: 400 }
    );
  }

  // Load all responses for this event
  const attendeeIds = eventAttendees.map((a) => a.id);
  const allResponses = await db
    .select()
    .from(responses)
    .where(
      // fetch responses for all attendees in this event
      eq(
        responses.attendeeId,
        // using a subquery workaround: filter in-memory
        responses.attendeeId
      )
    );

  const eventResponses = allResponses.filter((r) =>
    attendeeIds.includes(r.attendeeId)
  );

  // Build attendee response maps
  const matchAttendees: MatchAttendee[] = eventAttendees.map((a) => {
    const attendeeResponses = eventResponses.filter(
      (r) => r.attendeeId === a.id
    );
    const responseMap: Record<string, unknown> = {};
    for (const r of attendeeResponses) {
      responseMap[r.questionId] = r.value;
    }
    return {
      id: a.id,
      groupId: a.groupId,
      responses: responseMap,
    };
  });

  // Filter out attendees who answered fewer than 50% of questions
  const threshold = Math.ceil(eventQuestions.length * 0.5);
  const qualifiedAttendees = matchAttendees.filter(
    (a) => Object.keys(a.responses).length >= threshold
  );
  const excludedCount = matchAttendees.length - qualifiedAttendees.length;

  if (qualifiedAttendees.length < 2) {
    return NextResponse.json(
      { error: "Not enough attendees with sufficient responses to run matching" },
      { status: 400 }
    );
  }

  // Run engine
  const results = runMatchingEngine({
    questions: eventQuestions.map((q) => ({
      id: q.id,
      type: q.type,
      weight: q.weight,
      scaleMin: q.scaleMin ?? 1,
      scaleMax: q.scaleMax ?? 10,
    })),
    attendees: qualifiedAttendees,
    matchCount: event.matchCount,
    matchingMode: event.matchingMode,
  });

  // Store matches + update event status
  await db.delete(matches).where(eq(matches.eventId, eventId));

  if (results.length > 0) {
    await db.insert(matches).values(
      results.map((r) => ({
        eventId,
        attendeeAId: r.attendeeAId,
        attendeeBId: r.attendeeBId,
        score: r.score,
        rankForA: r.rankForA,
        rankForB: r.rankForB,
      }))
    );
  }

  await db
    .update(events)
    .set({ status: "matched", updatedAt: new Date() })
    .where(eq(events.id, eventId));

  return NextResponse.json({ matchCount: results.length, excludedCount });
}
