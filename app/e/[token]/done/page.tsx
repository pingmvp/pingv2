import { db } from "@/lib/db";
import { attendees, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ConfirmationPage({ params }: Props) {
  const { token } = await params;

  // token here is the attendee's unique token
  const [attendee] = await db
    .select()
    .from(attendees)
    .where(eq(attendees.token, token));

  const eventName = attendee
    ? await db
        .select({ name: events.name, matchCount: events.matchCount })
        .from(events)
        .where(eq(events.id, attendee.eventId))
        .then((r) => r[0])
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-5xl">✓</div>
        <h1 className="text-2xl font-bold tracking-tight">You&apos;re in!</h1>
        {eventName && (
          <p className="text-muted-foreground">
            You&apos;re registered for{" "}
            <span className="font-medium text-foreground">{eventName.name}</span>
            .
          </p>
        )}
        <p className="text-muted-foreground text-sm">
          You&apos;ll receive a text message with your{" "}
          {eventName?.matchCount ?? "top"}{" "}
          {(eventName?.matchCount ?? 2) === 1 ? "match" : "matches"} before the
          event starts.
        </p>
      </div>
    </div>
  );
}
