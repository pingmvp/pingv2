import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, attendees, questions, groups, matches } from "@/lib/db/schema";
import { and, eq, desc, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { openEvent, closeEvent, seedTestAttendees, saveGroups, saveEventZones } from "../actions";
import { RunMatchingButton } from "./match/run-matching-button";
import { DeliverResultsButton } from "./match/deliver-results-button";
import { CopyButton } from "./copy-button";
import { AutoRefresh } from "./auto-refresh";
import { QRCodeDisplay } from "./qr-code-display";
import { AttendeeList } from "./attendee-list";
import { ArchiveEventButton } from "./archive-event-button";
import { formatDateTime } from "@/lib/format";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  MessageSquare,
  Zap,
  Link2,
  Check,
  Pencil,
  FlaskConical,
  Presentation,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";

// ── Status config ─────────────────────────────────────────────

const STATUS_STEPS = ["draft", "open", "closed", "matched", "delivered"] as const;

const STATUS_META: Record<string, {
  label: string;
  hint: string;
  badgeBg: string;
  dot: string;
  stepActive: string;
}> = {
  draft: {
    label: "Draft",
    hint: "Add at least 3 questions, then open the event.",
    badgeBg: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    stepActive: "bg-slate-700 border-slate-700 ring-slate-200",
  },
  open: {
    label: "Open",
    hint: "Collecting responses. Share the attendee link.",
    badgeBg: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500 animate-pulse",
    stepActive: "bg-emerald-500 border-emerald-500 ring-emerald-200",
  },
  closed: {
    label: "Closed",
    hint: "Responses closed. Ready to run matching.",
    badgeBg: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
    stepActive: "bg-blue-500 border-blue-500 ring-blue-200",
  },
  matched: {
    label: "Matched",
    hint: "Matches generated. Deliver results to attendees.",
    badgeBg: "bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
    stepActive: "bg-violet-500 border-violet-500 ring-violet-200",
  },
  delivered: {
    label: "Delivered",
    hint: "All done — matches sent to attendees.",
    badgeBg: "bg-teal-50 text-teal-700",
    dot: "bg-teal-500",
    stepActive: "bg-teal-500 border-teal-500 ring-teal-200",
  },
  archived: {
    label: "Archived",
    hint: "Event archived. Responses and email addresses have been deleted.",
    badgeBg: "bg-slate-100 text-slate-500",
    dot: "bg-slate-400",
    stepActive: "bg-slate-400 border-slate-400 ring-slate-200",
  },
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  scale: "Scale",
};

// ── Helpers ───────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
];

function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function scoreLabel(score: number): { label: string; color: string; bar: string } {
  if (score >= 0.8) return { label: "Excellent", color: "text-emerald-700", bar: "bg-emerald-500" };
  if (score >= 0.6) return { label: "Good", color: "text-blue-700", bar: "bg-blue-500" };
  if (score >= 0.4) return { label: "Fair", color: "text-amber-700", bar: "bg-amber-500" };
  return { label: "Low", color: "text-slate-500", bar: "bg-slate-400" };
}

function Avatar({ name }: { name: string }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(name)}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

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

  const questionList = await db
    .select()
    .from(questions)
    .where(eq(questions.eventId, id))
    .orderBy(asc(questions.order));

  const attendeeList = await db
    .select({ id: attendees.id, name: attendees.name, createdAt: attendees.createdAt })
    .from(attendees)
    .where(eq(attendees.eventId, id))
    .orderBy(desc(attendees.createdAt));

  const eventGroups = event.matchingMode === "two_sided"
    ? await db.select().from(groups).where(eq(groups.eventId, id))
    : [];

  // Load matches for matched/delivered/archived events
  const hasMatchStatus = event.status === "matched" || event.status === "delivered" || event.status === "archived";
  const aA = alias(attendees, "aA");
  const aB = alias(attendees, "aB");
  const matchRows = hasMatchStatus
    ? await db
        .select({
          id: matches.id,
          score: matches.score,
          zone: matches.zone,
          nameA: aA.name,
          nameB: aB.name,
        })
        .from(matches)
        .innerJoin(aA, eq(matches.attendeeAId, aA.id))
        .innerJoin(aB, eq(matches.attendeeBId, aB.id))
        .where(eq(matches.eventId, id))
        .orderBy(desc(matches.score))
    : [];

  const questionCount = questionList.length;
  const attendeeCount = attendeeList.length;
  const isLive = event.status === "open";
  const isArchived = event.status === "archived";
  const currentStep = STATUS_STEPS.indexOf(event.status as typeof STATUS_STEPS[number]);
  const meta = STATUS_META[event.status];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {isLive && <AutoRefresh intervalMs={20000} />}

      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Events
      </Link>

      {/* ── Hero card ─────────────────────────────────────────── */}
      <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-6 space-y-5">
        {/* Top row: name + actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.badgeBg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
            <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
            {(event.date || event.location) && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {event.date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateTime(event.date)}
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.location}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 pt-1 flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/events/${id}/edit`}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Link>
            </Button>
            {event.status === "open" && (
              <Button asChild size="sm" variant="outline">
                <Link href={`/events/${id}/lobby`}>
                  <Presentation className="w-3.5 h-3.5 mr-1.5" />
                  Present
                </Link>
              </Button>
            )}
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
              <RunMatchingButton eventId={id} label="Run matching →" size="sm" />
            )}
            {event.status === "matched" && (
              <DeliverResultsButton eventId={id} />
            )}
            {(event.status === "matched" || event.status === "delivered") && (
              <ArchiveEventButton eventId={id} />
            )}
          </div>
        </div>

        {/* Archived notice */}
        {isArchived && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700">This event has been archived.</p>
            <p>Questionnaire responses and attendee email addresses have been permanently deleted. Attendee names and match scores are retained.</p>
          </div>
        )}

        {/* Status stepper */}
        {!isArchived && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                const isLast = i === STATUS_STEPS.length - 1;
                const stepMeta = STATUS_META[step];
                return (
                  <div key={step} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center gap-1.5 min-w-0">
                      <div
                        className={[
                          "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                          done
                            ? "bg-foreground border-foreground text-background"
                            : active
                            ? `text-white ring-2 ring-offset-1 ${stepMeta.stepActive}`
                            : "border-border bg-background text-muted-foreground",
                        ].join(" ")}
                      >
                        {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      <span className={`text-[10px] font-medium text-center leading-none ${active ? "text-foreground" : "text-muted-foreground"}`}>
                        {stepMeta.label}
                      </span>
                    </div>
                    {!isLast && (
                      <div className={`h-px flex-1 mb-4 mx-1.5 transition-colors ${i < currentStep ? "bg-foreground/30" : "bg-border"}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center">{meta.hint}</p>
          </div>
        )}
      </div>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={`transition-colors ${isLive && attendeeCount > 0 ? "border-emerald-200 bg-emerald-50/40" : ""}`}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isLive ? "bg-emerald-100" : "bg-muted"}`}>
                <Users className={`w-4 h-4 ${isLive ? "text-emerald-600" : "text-muted-foreground"}`} />
              </div>
              {isLive && attendeeCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1" />
              )}
            </div>
            <p className="text-3xl font-bold tracking-tight">{attendeeCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{attendeeCount === 1 ? "Response" : "Responses"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center mb-3">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{questionCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{questionCount === 1 ? "Question" : "Questions"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center mb-3">
              <Zap className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{event.matchCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Matches / person</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Meeting zones ──────────────────────────────────────── */}
      {hasMatchStatus && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold">Meeting zones</CardTitle>
                  <span className="text-xs text-muted-foreground border rounded-full px-1.5 py-0.5">optional</span>
                </div>
                <CardDescription className="text-xs">
                  {event.zones && event.zones.length > 0
                    ? `${event.zones.length} zone${event.zones.length !== 1 ? "s" : ""} — ${matchRows.length} pairs distributed evenly`
                    : "Assign zones to tell attendees where to meet their match."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {(event.status === "matched" || event.status === "delivered") && (
            <CardContent>
              <form action={saveEventZones.bind(null, id)} className="space-y-3">
                <Textarea
                  name="zones"
                  placeholder={"Zone A\nZone B\nZone C"}
                  defaultValue={(event.zones ?? []).join("\n")}
                  rows={3}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  One zone per line. {matchRows.length} pairs distributed evenly. Leave blank to clear.
                </p>
                <Button type="submit" size="sm" variant="outline">Save zones</Button>
              </form>
            </CardContent>
          )}
          {event.status === "archived" && event.zones && event.zones.length > 0 && (
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {event.zones.map((z) => (
                  <span key={z} className="text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {z}
                  </span>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* ── Attendee link ──────────────────────────────────────── */}
      {event.status !== "draft" && !isArchived && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Link2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Attendee link</CardTitle>
                <CardDescription className="text-xs">
                  Share via Luma, Partiful, or directly — no account required
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-xs font-mono truncate">
                {origin}/e/{id}
              </code>
              <CopyButton text={`/e/${id}`} />
            </div>
            <div className="border-t pt-4">
              <QRCodeDisplay url={`${origin}/e/${id}`} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Dev seed panel ─────────────────────────────────────── */}
      {process.env.NODE_ENV === "development" && event.status === "open" && (
        <Card className="border-dashed border-amber-300 bg-amber-50/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <FlaskConical className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-amber-800">Seed test attendees</CardTitle>
                <CardDescription className="text-xs">Dev only — generates fake attendees with random responses.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form action={seedTestAttendees.bind(null, id)} className="flex items-center gap-3">
              <input
                type="number"
                name="count"
                min={1}
                max={50}
                defaultValue={10}
                className="w-20 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <Button type="submit" size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
                Seed attendees
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Respondees ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isLive ? "bg-emerald-100" : "bg-muted"}`}>
              <Users className={`w-4 h-4 ${isLive ? "text-emerald-600" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold">Respondees</CardTitle>
                {isLive && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <CardDescription className="text-xs">
                {attendeeCount === 0
                  ? "No responses yet."
                  : `${attendeeCount} ${attendeeCount === 1 ? "person has" : "people have"} responded.`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attendeeCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No responses yet</p>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  {event.status === "draft"
                    ? "Open the event first, then share the attendee link."
                    : "Share the link above to start collecting responses."}
                </p>
              </div>
            </div>
          ) : (
            <AttendeeList attendees={attendeeList} eventId={id} />
          )}
        </CardContent>
      </Card>

      {/* ── Matches ────────────────────────────────────────────── */}
      {matchRows.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Matches</CardTitle>
                  <CardDescription className="text-xs">
                    {matchRows.length} pairs · avg{" "}
                    {Math.round((matchRows.reduce((s, m) => s + m.score, 0) / matchRows.length) * 100)}% compatibility
                  </CardDescription>
                </div>
              </div>
              {event.status === "matched" && (
                <RunMatchingButton eventId={id} label="Re-run" size="sm" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {matchRows.map((m) => {
                const pct = Math.round(m.score * 100);
                const { label, color, bar } = scoreLabel(m.score);
                return (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 w-32 shrink-0 min-w-0">
                      <Avatar name={m.nameA} />
                      <span className="text-sm font-medium truncate">{m.nameA}</span>
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-semibold ${color}`}>{label}</span>
                        <span className="text-muted-foreground font-medium">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-32 shrink-0 min-w-0 justify-end">
                      <span className="text-sm font-medium truncate text-right">{m.nameB}</span>
                      <Avatar name={m.nameB} />
                    </div>
                    {m.zone && (
                      <div className="flex items-center gap-1 shrink-0 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                        <MapPin className="w-3 h-3" />
                        {m.zone}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── Questions & Groups ─────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Questions</CardTitle>
                <CardDescription className="text-xs">
                  {questionCount === 0
                    ? "Need at least 3 before you can open the event."
                    : `${questionCount} question${questionCount !== 1 ? "s" : ""} configured.`}
                </CardDescription>
              </div>
            </div>
            {event.status === "draft" && (
              <Button asChild size="sm" variant={questionCount === 0 ? "default" : "outline"}>
                <Link href={`/events/${id}/questions`}>
                  {questionCount === 0 ? "Add questions" : "Edit"}
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Matching groups (two-sided only) — shown above questions */}
          {event.matchingMode === "two_sided" && (
            <div className="space-y-3 pb-3 border-b">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Matching groups
              </p>
              {eventGroups.length >= 2 ? (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1 rounded-lg border bg-muted/30 px-4 py-2.5 text-center">
                      <p className="text-xs text-muted-foreground mb-0.5">Group A</p>
                      <p className="font-semibold text-sm">{eventGroups[0].name}</p>
                    </div>
                    <div className="flex items-center text-muted-foreground text-xs font-medium">↔</div>
                    <div className="flex-1 rounded-lg border bg-muted/30 px-4 py-2.5 text-center">
                      <p className="text-xs text-muted-foreground mb-0.5">Group B</p>
                      <p className="font-semibold text-sm">{eventGroups[1].name}</p>
                    </div>
                  </div>
                  {event.status === "draft" && (
                    <form action={saveGroups.bind(null, id)} className="flex gap-2">
                      <input
                        name="groupA"
                        defaultValue={eventGroups[0].name}
                        placeholder="e.g. Investors"
                        className="flex-1 rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <input
                        name="groupB"
                        defaultValue={eventGroups[1].name}
                        placeholder="e.g. Founders"
                        className="flex-1 rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <Button type="submit" size="sm" variant="outline">Rename</Button>
                    </form>
                  )}
                </div>
              ) : (
                <form action={saveGroups.bind(null, id)} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      name="groupA"
                      placeholder="e.g. Investors"
                      required
                      className="flex-1 rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      name="groupB"
                      placeholder="e.g. Founders"
                      required
                      className="flex-1 rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button type="submit" size="sm">Create groups</Button>
                  </div>
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Groups must be set up before you open the event.
                  </p>
                </form>
              )}
            </div>
          )}

          {/* Question list */}
          {questionCount === 0 ? (
            <p className="text-xs text-muted-foreground">No questions added yet.</p>
          ) : (
            <ul className="space-y-0">
              {questionList.map((q, i) => {
                const w = q.weight;
                const weightDisplay =
                  w >= 7
                    ? { icon: <ArrowUp className="w-3 h-3" />, cls: "text-emerald-600 bg-emerald-50" }
                    : w >= 4
                    ? { icon: <Minus className="w-3 h-3" />, cls: "text-sky-600 bg-sky-50" }
                    : { icon: <ArrowDown className="w-3 h-3" />, cls: "text-red-400 bg-red-50" };

                return (
                  <li key={q.id} className="flex items-start gap-3 py-2.5 border-b last:border-0">
                    <span className="text-xs text-muted-foreground font-medium w-5 shrink-0 mt-0.5">
                      {i + 1}.
                    </span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium leading-snug">{q.text}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {QUESTION_TYPE_LABELS[q.type]}
                        </Badge>
                        {q.options && q.options.length > 0 && (
                          <span className="text-xs text-muted-foreground truncate max-w-[240px]">
                            {q.options.join(" · ")}
                          </span>
                        )}
                        {q.type === "scale" && (
                          <span className="text-xs text-muted-foreground">
                            {q.scaleMin ?? 1}–{q.scaleMax ?? 10}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold shrink-0 ${weightDisplay.cls}`}>
                      {weightDisplay.icon}
                      {w}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {event.status === "draft" && questionCount > 0 && questionCount < 3 && (
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
              <p className="text-xs text-amber-700 font-medium">
                {3 - questionCount} more {3 - questionCount === 1 ? "question" : "questions"} needed to open.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
