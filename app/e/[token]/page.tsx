import { db } from "@/lib/db";
import { events, questions, groups } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { QuestionnaireForm } from "./questionnaire-form";

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function AttendeePage({ params, searchParams }: Props) {
  const { token: eventId } = await params;
  const { error } = await searchParams;

  const cookieStore = await cookies();
  const existingToken = cookieStore.get(`ping_submission_${eventId}`)?.value;
  if (existingToken) {
    redirect(`/e/${existingToken}/done`);
  }

  const [event] = await db.select().from(events).where(eq(events.id, eventId));

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

  if (event.status === "closed" || event.status === "matched" || event.status === "delivered" || event.status === "archived") {
    return (
      <Screen>
        <h1 className="text-xl font-bold">{event.name}</h1>
        <p className="text-muted-foreground text-sm">
          This event is no longer accepting responses.
        </p>
      </Screen>
    );
  }

  const eventQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.eventId, eventId))
    .orderBy(asc(questions.order));

  const eventGroups = event.matchingMode === "two_sided"
    ? await db
        .select({ id: groups.id, name: groups.name })
        .from(groups)
        .where(eq(groups.eventId, eventId))
    : [];

  return (
    <QuestionnaireForm
      eventId={eventId}
      event={{
        name: event.name,
        description: event.description,
        matchCount: event.matchCount,
      }}
      questions={eventQuestions}
      groups={eventGroups}
      serverError={error}
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
