import { db } from "@/lib/db";
import { events, questions } from "@/lib/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { QuestionnaireForm } from "./questionnaire-form";
import { formatDateTime } from "@/lib/format";

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function AttendeePage({ params, searchParams }: Props) {
  const { token: eventId } = await params;
  const { error } = await searchParams;

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId));

  // Event not found
  if (!event) {
    return (
      <Screen>
        <h1 className="text-xl font-bold">Link not found</h1>
        <p className="text-muted-foreground text-sm">
          This event link doesn&apos;t exist or has expired.
        </p>
      </Screen>
    );
  }

  // Event not open
  if (event.status === "draft") {
    return (
      <Screen>
        <h1 className="text-xl font-bold">{event.name}</h1>
        <p className="text-muted-foreground text-sm">
          This event isn&apos;t open for responses yet. Check back soon.
        </p>
      </Screen>
    );
  }

  if (event.status === "closed" || event.status === "matched" || event.status === "delivered") {
    return (
      <Screen>
        <h1 className="text-xl font-bold">{event.name}</h1>
        <p className="text-muted-foreground text-sm">
          This event is no longer accepting responses.
        </p>
      </Screen>
    );
  }

  // Load questions
  const eventQuestions = await db
    .select()
    .from(questions)
    .where(and(eq(questions.eventId, eventId)))
    .orderBy(asc(questions.order));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-10 space-y-8">
        {/* Event header */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            You&apos;re invited
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {event.date && <span>{formatDateTime(event.date)}</span>}
            {event.location && <span>· {event.location}</span>}
          </div>
          {event.description && (
            <p className="text-sm text-muted-foreground pt-1">{event.description}</p>
          )}
        </div>

        <p className="text-sm text-muted-foreground border-l-2 pl-3">
          Fill out this short questionnaire and we&apos;ll match you with the{" "}
          {event.matchCount} best people to meet at the event.
        </p>

        {/* Form */}
        <QuestionnaireForm
          eventId={eventId}
          questions={eventQuestions}
          error={error}
        />
      </div>
    </div>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-3 max-w-sm">{children}</div>
    </div>
  );
}
