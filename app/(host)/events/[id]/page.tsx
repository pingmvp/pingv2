import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, attendees, questions } from "@/lib/db/schema";
import { and, eq, count } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { openEvent, closeEvent } from "../actions";
import { CopyButton } from "./copy-button";
import { formatDateTime } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  matched: "Matched",
  delivered: "Delivered",
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  open: "default",
  closed: "secondary",
  matched: "secondary",
  delivered: "secondary",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.hostId, user!.id)));

  if (!event) notFound();

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const [{ value: attendeeCount }] = await db
    .select({ value: count() })
    .from(attendees)
    .where(eq(attendees.eventId, id));

  const [{ value: questionCount }] = await db
    .select({ value: count() })
    .from(questions)
    .where(eq(questions.eventId, id));

  const attendeeLink = `/e/${id}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_COLORS[event.status]}>
              {STATUS_LABELS[event.status]}
            </Badge>
            {event.date && (
              <span className="text-sm text-muted-foreground">
                {formatDateTime(event.date)}
              </span>
            )}
          </div>
        </div>

        {/* Primary action */}
        <div className="flex gap-2 shrink-0">
          {event.status === "draft" && (
            <form action={openEvent.bind(null, id)}>
              <Button type="submit" disabled={questionCount === 0}>
                Open event
              </Button>
            </form>
          )}
          {event.status === "open" && (
            <form action={closeEvent.bind(null, id)}>
              <Button type="submit" variant="secondary">
                Close responses
              </Button>
            </form>
          )}
          {event.status === "closed" && (
            <Button asChild>
              <Link href={`/events/${id}/match`}>Run matching</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{questionCount}</p>
            <p className="text-sm text-muted-foreground">
              {questionCount === 1 ? "Question" : "Questions"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{attendeeCount}</p>
            <p className="text-sm text-muted-foreground">
              {attendeeCount === 1 ? "Response" : "Responses"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{event.matchCount}</p>
            <p className="text-sm text-muted-foreground">
              Matches per attendee
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Questionnaire link */}
      {event.status !== "draft" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendee link</CardTitle>
            <CardDescription>
              Share this link via Luma, Partiful, or directly with attendees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono truncate">
                {origin}{attendeeLink}
              </code>
              <CopyButton text={attendeeLink} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions */}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Questions</CardTitle>
            <CardDescription>
              {questionCount === 0
                ? "Add questions before opening the event"
                : `${questionCount} question${questionCount !== 1 ? "s" : ""} configured`}
            </CardDescription>
          </div>
          {event.status === "draft" && (
            <Button asChild size="sm">
              <Link href={`/events/${id}/questions`}>
                {questionCount === 0 ? "Add questions" : "Edit questions"}
              </Link>
            </Button>
          )}
        </CardHeader>
        {questionCount === 0 && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No questions yet. You need at least 3 questions before opening the event.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

