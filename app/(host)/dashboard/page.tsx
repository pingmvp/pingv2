import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, attendees } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const hostEvents = await db
    .select()
    .from(events)
    .where(eq(events.hostId, user!.id))
    .orderBy(events.createdAt);

  const counts = await db
    .select({ eventId: attendees.eventId, value: count() })
    .from(attendees)
    .groupBy(attendees.eventId);

  const countMap = Object.fromEntries(counts.map((c) => [c.eventId, c.value]));

  return <DashboardClient events={hostEvents} countMap={countMap} />;
}
