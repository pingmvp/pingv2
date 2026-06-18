import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, attendees } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { Plus, Zap } from "lucide-react";
import { EventFilter } from "./event-filter";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const hostEvents = await db.select().from(events).where(eq(events.hostId, user!.id)).orderBy(events.createdAt);
  const counts = await db.select({ eventId: attendees.eventId, value: count() }).from(attendees).groupBy(attendees.eventId);
  const countMap = Object.fromEntries(counts.map((c) => [c.eventId, c.value]));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.01em] text-foreground">Events</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hostEvents.length === 0 ? "Create your first event to get started." : `${hostEvents.length} event${hostEvents.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/events/new">
          <button className="inline-flex items-center gap-2 h-[44px] px-5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-80 transition-all duration-150 active:scale-[0.97]">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            New event
          </button>
        </Link>
      </div>

      {hostEvents.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-black/12 p-16 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center mx-auto">
            <Zap className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-foreground">No events yet</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Create an event, build your questions, and start matching attendees.
            </p>
          </div>
          <Link href="/events/new">
            <button className="inline-flex items-center gap-2 h-[44px] px-5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-80 transition-all duration-150 active:scale-[0.97]">
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Create your first event
            </button>
          </Link>
        </div>
      ) : (
        <EventFilter events={hostEvents} countMap={countMap} />
      )}
    </div>
  );
}
