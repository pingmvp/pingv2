import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, attendees } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Plus, Zap } from "lucide-react";
import { EventFilter } from "./event-filter";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hostEvents.length === 0
              ? "Create your first event to get started."
              : `${hostEvents.length} event${hostEvents.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button asChild>
          <Link href="/events/new" className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            New event
          </Link>
        </Button>
      </div>

      {hostEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed p-16 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Zap className="w-7 h-7 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-base">No events yet</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Create an event, build your questions, and start matching attendees.
            </p>
          </div>
          <Button asChild>
            <Link href="/events/new" className="inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Create your first event
            </Link>
          </Button>
        </div>
      ) : (
        <EventFilter events={hostEvents} countMap={countMap} />
      )}
    </div>
  );
}
