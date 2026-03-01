import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, attendees, responses } from "@/lib/db/schema";
import { submitResponseSchema } from "@/lib/validators/response";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id: eventId } = await params;

  // Verify event is open
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.status, "open")));

  if (!event) {
    return NextResponse.json(
      { error: "Event not found or not accepting responses" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const parsed = submitResponseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, phone, groupId, answers } = parsed.data;

  // Check for duplicate phone on this event
  const [existing] = await db
    .select()
    .from(attendees)
    .where(and(eq(attendees.eventId, eventId), eq(attendees.phone, phone)));

  if (existing) {
    return NextResponse.json(
      { error: "You have already submitted a response for this event" },
      { status: 409 }
    );
  }

  // Insert attendee + responses in a transaction
  const token = randomUUID();

  const [attendee] = await db
    .insert(attendees)
    .values({ eventId, name, phone, token, groupId: groupId ?? null })
    .returning();

  await db.insert(responses).values(
    answers.map(({ questionId, value }) => ({
      attendeeId: attendee.id,
      questionId,
      value,
    }))
  );

  return NextResponse.json(
    { success: true, token, redirect: `/e/${token}/done` },
    { status: 201 }
  );
}
