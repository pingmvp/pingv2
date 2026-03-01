import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, matches, attendees } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

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

  return NextResponse.json({ event, matches: matchResults });
}
