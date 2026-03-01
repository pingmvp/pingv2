import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, attendees, questions } from "@/lib/db/schema";
import { and, eq, count, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { openEvent, closeEvent } from "../actions";
import { CopyButton } from "./copy-button";
import { AutoRefresh } from "./auto-refresh";
import { formatDateTime } from "@/lib/format";

const STATUS_STEPS = ["draft", "open", "closed", "matched", "delivered"] as const;
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  matched: "Matched",
  delivered: "Delivered",
};
const STATUS_DESCRIPTIONS: Record<string, string> = {
  draft: "Add questions and open the event when ready.",
  open: "Collecting responses. Share the link with attendees.",
  closed: "Responses closed. Ready to run matching.",
  matched: "Matches generated. Review and deliver to attendees.",
  delivered: "Matches sent to attendees via SMS.",
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

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

  const [{ value: questionCount }] = await db
    .select({ value: count() })
    .from(questions)
    .where(eq(questions.eventId, id));

  const attendeeList = await db
    .select({ id: attendees.id, name: attendees.name, createdAt: attendees.createdAt })
    .from(attendees)
    .where(eq(attendees.eventId, id))
    .orderBy(desc(attendees.createdAt));

  const attendeeCount = attendeeList.length;
  const isLive = event.status === "open";
  const attendeeLink = `${origin}/e/${id}`;
  const currentStep = STATUS_STEPS.indexOf(event.status as typeof STATUS_STEPS[number]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {isLive && <AutoRefresh intervalMs={20000} />}

      {/* Back link */}
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block"
      >
        ← Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{event.name}</h1>
          {event.date && (
            <p className="text-sm text-muted-foreground">{formatDateTime(event.date)}{event.location ? ` · ${event.location}` : ""}</p>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {event.status === "draft" && (
            <form action={openEvent.bind(null, id)}>
              <Button type="submit" disabled={questionCount < 3}>
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
              <Link href={`/events/${id}/match`}>Run matching →</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Status stepper */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            const isLast = i === STATUS_STEPS.length - 1;
            return (
              <div key={step} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <div
                    className={[
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      done ? "bg-primary text-primary-foreground" : "",
                      active ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" : "",
                      !done && !active ? "bg-muted text-muted-foreground" : "",
                    ].join(" ")}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium text-center leading-tight ${active ? "text-foreground" : "text-muted-foreground"}`}>
                    {STATUS_LABELS[step]}
                  </span>
                </div>
                {!isLast && (
                  <div className={`h-px flex-1 mb-4 mx-1 ${i < currentStep ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {STATUS_DESCRIPTIONS[event.status]}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold">{attendeeCount}</p>
              {isLive && attendeeCount > 0 && (
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse mb-1" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {attendeeCount === 1 ? "Response" : "Responses"}
            </p>
          </CardContent>
        </Card>
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
            <p className="text-2xl font-bold">{event.matchCount}</p>
            <p className="text-sm text-muted-foreground">Matches / attendee</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendee link */}
      {event.status !== "draft" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendee link</CardTitle>
            <CardDescription>
              Share via Luma, Partiful, or directly. Anyone with this link can submit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono truncate">
                {attendeeLink}
              </code>
              <CopyButton text={`/e/${id}`} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live respondees */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Respondees</CardTitle>
              {isLive && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <CardDescription>
              {attendeeCount === 0
                ? "No responses yet."
                : `${attendeeCount} ${attendeeCount === 1 ? "person has" : "people have"} responded.`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {attendeeCount === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-3xl">👋</p>
              <p className="text-sm text-muted-foreground">
                {event.status === "draft"
                  ? "Open the event first, then share the attendee link."
                  : "Share the attendee link above to start collecting responses."}
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {attendeeList.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate">{a.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {timeAgo(a.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">Questions</CardTitle>
            <CardDescription>
              {questionCount === 0
                ? "Add at least 3 questions before opening the event."
                : `${questionCount} question${questionCount !== 1 ? "s" : ""} configured.`}
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
        {event.status === "draft" && questionCount > 0 && questionCount < 3 && (
          <CardContent>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {3 - questionCount} more question{3 - questionCount !== 1 ? "s" : ""} needed before you can open.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
