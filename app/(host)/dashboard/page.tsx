import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, attendees } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  open: "default",
  closed: "secondary",
  matched: "secondary",
  delivered: "secondary",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const hostEvents = await db
    .select()
    .from(events)
    .where(eq(events.hostId, user!.id))
    .orderBy(events.createdAt);

  // Get attendee counts for all events
  const counts = await db
    .select({ eventId: attendees.eventId, value: count() })
    .from(attendees)
    .groupBy(attendees.eventId);

  const countMap = Object.fromEntries(counts.map((c) => [c.eventId, c.value]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Your Events</h1>
        <Button asChild>
          <Link href="/events/new">New event</Link>
        </Button>
      </div>

      {hostEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center space-y-3">
          <p className="font-medium">No events yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first event to get started
          </p>
          <Button asChild className="mt-2">
            <Link href="/events/new">Create event</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {hostEvents.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium group-hover:underline underline-offset-2 truncate">
                    {event.name}
                  </span>
                  <Badge variant={STATUS_COLORS[event.status]}>
                    {event.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {event.date ? formatDate(event.date) : "No date set"}
                  {event.location ? ` · ${event.location}` : ""}
                  {" · "}
                  {countMap[event.id] ?? 0}{" "}
                  {(countMap[event.id] ?? 0) === 1 ? "response" : "responses"}
                </p>
              </div>
              <span className="text-muted-foreground text-sm shrink-0 ml-4">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
