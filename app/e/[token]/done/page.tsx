import { db } from "@/lib/db";
import { attendees, events, matches } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { MatchesPoller } from "./matches-poller";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ConfirmationPage({ params }: Props) {
  const { token } = await params;

  const [attendee] = await db
    .select()
    .from(attendees)
    .where(eq(attendees.token, token));

  if (!attendee) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-sm">
          <h1 className="text-xl font-bold">Link not found</h1>
          <p className="text-muted-foreground text-sm">This link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const [event] = await db
    .select({ status: events.status, name: events.name, matchCount: events.matchCount })
    .from(events)
    .where(eq(events.id, attendee.eventId));

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-sm">
          <h1 className="text-xl font-bold">Event not found</h1>
        </div>
      </div>
    );
  }

  const isReady = event.status === "matched" || event.status === "delivered";

  let matchList: { id: string; partnerName: string; rank: number; score: number; zone: string | null }[] = [];

  if (isReady) {
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

    matchList = matchRows
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
  }

  return (
    <MatchesPoller
      token={token}
      initial={{
        status: isReady ? "ready" : "waiting",
        eventName: event.name,
        attendeeName: attendee.name,
        matchCount: event.matchCount,
        matches: matchList,
      }}
    />
  );
}
