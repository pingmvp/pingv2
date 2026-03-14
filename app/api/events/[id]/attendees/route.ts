import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, attendees } from "@/lib/db/schema";
import { and, eq, asc } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [event] = await db
    .select({ id: events.id, status: events.status })
    .from(events)
    .where(and(eq(events.id, id), eq(events.hostId, user.id)));

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const attendeeList = await db
    .select({ id: attendees.id, name: attendees.name, createdAt: attendees.createdAt })
    .from(attendees)
    .where(eq(attendees.eventId, id))
    .orderBy(asc(attendees.createdAt));

  return NextResponse.json({
    status: event.status,
    attendees: attendeeList,
  });
}
