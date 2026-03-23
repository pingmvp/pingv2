import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendees, events, matches } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;

  const [attendee] = await db
    .select()
    .from(attendees)
    .where(eq(attendees.token, token));

  if (!attendee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [event] = await db
    .select({ status: events.status, name: events.name, matchCount: events.matchCount })
    .from(events)
    .where(eq(events.id, attendee.eventId));

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (event.status !== "matched" && event.status !== "delivered") {
    return NextResponse.json({
      status: "waiting",
      eventName: event.name,
      attendeeName: attendee.name,
      matchCount: event.matchCount,
      matches: [],
    });
  }

  const attendeeA = alias(attendees, "attendeeA");
  const attendeeB = alias(attendees, "attendeeB");

  const matchRows = await db
    .select({
      id: matches.id,
      score: matches.score,
      zone: matches.zone,
      rankForA: matches.rankForA,
      rankForB: matches.rankForB,
      attendeeAId: matches.attendeeAId,
      attendeeBId: matches.attendeeBId,
      attendeeAName: attendeeA.name,
      attendeeBName: attendeeB.name,
    })
    .from(matches)
    .innerJoin(attendeeA, eq(matches.attendeeAId, attendeeA.id))
    .innerJoin(attendeeB, eq(matches.attendeeBId, attendeeB.id))
    .where(
      or(
        eq(matches.attendeeAId, attendee.id),
        eq(matches.attendeeBId, attendee.id)
      )
    );

  const formatted = matchRows
    .map((m) => {
      const isA = m.attendeeAId === attendee.id;
      return {
        id: m.id,
        partnerName: isA ? m.attendeeBName : m.attendeeAName,
        rank: isA ? m.rankForA : m.rankForB,
        score: m.score,
        zone: m.zone ?? null,
      };
    })
    .sort((a, b) => a.rank - b.rank);

  return NextResponse.json({
    status: "ready",
    eventName: event.name,
    attendeeName: attendee.name,
    matchCount: event.matchCount,
    matches: formatted,
  });
}
