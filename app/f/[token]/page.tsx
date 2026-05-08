import { db } from "@/lib/db";
import { attendees, events, surveyResponses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SurveyForm } from "./survey-form";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SurveyPage({ params }: Props) {
  const { token } = await params;

  const [attendee] = await db
    .select()
    .from(attendees)
    .where(eq(attendees.token, token));

  if (!attendee) {
    return (
      <Screen>
        <h1 className="text-xl font-bold">Link not found</h1>
        <p className="text-muted-foreground text-sm">
          This survey link is invalid or has expired.
        </p>
      </Screen>
    );
  }

  const [event] = await db
    .select({ status: events.status, name: events.name })
    .from(events)
    .where(eq(events.id, attendee.eventId));

  if (!event) {
    return (
      <Screen>
        <h1 className="text-xl font-bold">Event not found</h1>
        <p className="text-muted-foreground text-sm">
          Something went wrong. Please try again later.
        </p>
      </Screen>
    );
  }

  // Survey is only available once matching has run
  const isReady =
    event.status === "matched" || event.status === "delivered";

  if (!isReady) {
    return (
      <Screen>
        <h1 className="text-xl font-bold">{event.name}</h1>
        <p className="text-muted-foreground text-sm">
          Your survey will be available after the event. Check back soon.
        </p>
      </Screen>
    );
  }

  // Guard: already submitted
  const [existing] = await db
    .select({ id: surveyResponses.id })
    .from(surveyResponses)
    .where(eq(surveyResponses.attendeeId, attendee.id));

  if (existing) {
    return (
      <Screen>
        <h1 className="text-xl font-bold">Already submitted</h1>
        <p className="text-muted-foreground text-sm">
          You&apos;ve already completed this survey. Thanks for your feedback!
        </p>
      </Screen>
    );
  }

  return (
    <SurveyForm
      attendeeId={attendee.id}
      eventId={attendee.eventId}
      token={token}
      attendeeName={attendee.name}
    />
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-3 max-w-sm">{children}</div>
    </div>
  );
}
