import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { createEventSchema } from "@/lib/validators/event";
import { eq } from "drizzle-orm";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hostEvents = await db
    .select()
    .from(events)
    .where(eq(events.hostId, user.id))
    .orderBy(events.createdAt);

  return NextResponse.json(hostEvents);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [event] = await db
    .insert(events)
    .values({ ...parsed.data, hostId: user.id })
    .returning();

  return NextResponse.json(event, { status: 201 });
}
