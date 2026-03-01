import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, attendees } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { Plus, Calendar, MapPin, Users, ChevronRight, Zap } from "lucide-react";

const STATUS_CONFIG: Record<string, {
  label: string;
  dot: string;
  badge: string;
  leftBorder: string;
}> = {
  draft: {
    label: "Draft",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600",
    leftBorder: "border-l-slate-300",
  },
  open: {
    label: "Open",
    dot: "bg-emerald-500 animate-pulse",
    badge: "bg-emerald-50 text-emerald-700",
    leftBorder: "border-l-emerald-400",
  },
  closed: {
    label: "Closed",
    dot: "bg-blue-400",
    badge: "bg-blue-50 text-blue-700",
    leftBorder: "border-l-blue-400",
  },
  matched: {
    label: "Matched",
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700",
    leftBorder: "border-l-violet-400",
  },
  delivered: {
    label: "Delivered",
    dot: "bg-teal-500",
    badge: "bg-teal-50 text-teal-700",
    leftBorder: "border-l-teal-400",
  },
};

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hostEvents.map((event) => {
            const cfg = STATUS_CONFIG[event.status];
            const responseCount = countMap[event.id] ?? 0;

            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className={`group relative block rounded-xl border border-l-4 ${cfg.leftBorder} bg-card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
              >
                {/* Status badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>

                {/* Event name */}
                <h2 className="font-semibold text-base leading-snug mb-3 group-hover:text-primary transition-colors">
                  {event.name}
                </h2>

                {/* Metadata */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-4">
                  {event.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {formatDate(event.date)}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {event.location}
                    </span>
                  )}
                </div>

                {/* Response count */}
                <div className="flex items-center gap-1.5 text-sm border-t pt-3">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {responseCount}{" "}
                    {responseCount === 1 ? "response" : "responses"}
                  </span>
                  {event.status === "open" && (
                    <span className="ml-auto text-xs font-medium text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
