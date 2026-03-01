import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, questions } from "@/lib/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { QuestionBuilder } from "./question-builder";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function QuestionsPage({ params, searchParams }: Props) {
  const { id: eventId } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.hostId, user!.id)));

  if (!event) notFound();

  if (event.status !== "draft") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Link
          href={`/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to event
        </Link>
        <p className="text-muted-foreground text-sm">
          Questions cannot be edited after the event is opened.
        </p>
      </div>
    );
  }

  const existingQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.eventId, eventId))
    .orderBy(asc(questions.order));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <Link
          href={`/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {event.name}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Questions</h1>
        <p className="text-sm text-muted-foreground">
          Add 3–10 questions. Weight determines how much each question influences matching.
        </p>
      </div>

      <QuestionBuilder
        eventId={eventId}
        initialQuestions={existingQuestions}
        error={error}
      />
    </div>
  );
}
