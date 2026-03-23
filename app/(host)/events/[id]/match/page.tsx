import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, matches, attendees, questions } from "@/lib/db/schema";
import { and, eq, count, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users, Zap, TrendingUp, Send, MapPin } from "lucide-react";
import { RunMatchingButton } from "./run-matching-button";
import { DeliverResultsButton } from "./deliver-results-button";
import { saveEventZones } from "../../actions";

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

function scoreLabel(score: number): { label: string; color: string; bar: string } {
  if (score >= 0.8) return { label: "Excellent", color: "text-emerald-700", bar: "bg-emerald-500" };
  if (score >= 0.6) return { label: "Good", color: "text-blue-700", bar: "bg-blue-500" };
  if (score >= 0.4) return { label: "Fair", color: "text-amber-700", bar: "bg-amber-500" };
  return { label: "Low", color: "text-slate-500", bar: "bg-slate-400" };
}

function Avatar({ name }: { name: string }) {
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(name)}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MatchPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.hostId, user!.id)));

  if (!event) notFound();

  // Redirect-guard: only closed/matched/delivered/archived allowed here
  if (event.status === "draft" || event.status === "open") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <Link href={`/events/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to event
        </Link>
        <p className="text-sm text-muted-foreground">
          Close the event before running matching.
        </p>
      </div>
    );
  }

  // Load aggregate counts
  const [{ value: attendeeCount }] = await db
    .select({ value: count() })
    .from(attendees)
    .where(eq(attendees.eventId, id));

  const [{ value: questionCount }] = await db
    .select({ value: count() })
    .from(questions)
    .where(eq(questions.eventId, id));

  // Load existing matches (if any)
  const aA = alias(attendees, "aA");
  const aB = alias(attendees, "aB");

  const matchRows = await db
    .select({
      id: matches.id,
      score: matches.score,
      rankForA: matches.rankForA,
      rankForB: matches.rankForB,
      zone: matches.zone,
      nameA: aA.name,
      nameB: aB.name,
    })
    .from(matches)
    .innerJoin(aA, eq(matches.attendeeAId, aA.id))
    .innerJoin(aB, eq(matches.attendeeBId, aB.id))
    .where(eq(matches.eventId, id))
    .orderBy(desc(matches.score));

  const hasResults = matchRows.length > 0;
  const avgScore = hasResults
    ? matchRows.reduce((s, m) => s + m.score, 0) / matchRows.length
    : 0;
  const topScore = hasResults ? matchRows[0].score : 0;

  // Derive current unique zones (preserving input order)
  const assignedZones = [...new Set(matchRows.map((m) => m.zone).filter(Boolean))] as string[];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {event.name}
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Matching</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {hasResults
            ? `${matchRows.length} pairs generated from ${attendeeCount} responses.`
            : `${attendeeCount} responses across ${questionCount} questions — ready to match.`}
        </p>
      </div>

      {/* ── Pre-match CTA ─────────────────────────────────── */}
      {event.status === "closed" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                <Zap className="w-5 h-5 text-background" />
              </div>
              <div>
                <CardTitle className="text-base">Run matching engine</CardTitle>
                <CardDescription>
                  Compares every attendee pair and picks the top {event.matchCount} match
                  {event.matchCount !== 1 ? "es" : ""} per person.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Users, label: "Respondees", value: attendeeCount },
                { icon: Zap, label: "Questions", value: questionCount },
                { icon: TrendingUp, label: "Matches / person", value: event.matchCount },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-muted/60 p-3 text-center">
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <RunMatchingButton eventId={id} />
          </CardContent>
        </Card>
      )}

      {/* ── Results ────────────────────────────────────────── */}
      {hasResults && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-3xl font-bold tracking-tight">{matchRows.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total pairs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-3xl font-bold tracking-tight">
                  {Math.round(avgScore * 100)}%
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Avg compatibility</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-3xl font-bold tracking-tight">
                  {Math.round(topScore * 100)}%
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Top score</p>
              </CardContent>
            </Card>
          </div>

          {/* Match list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">All pairs</CardTitle>
              <CardDescription>Sorted by compatibility score — highest first.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {matchRows.map((m) => {
                  const pct = Math.round(m.score * 100);
                  const { label, color, bar } = scoreLabel(m.score);

                  return (
                    <li
                      key={m.id}
                      className="flex items-center gap-4 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                    >
                      {/* Person A */}
                      <div className="flex items-center gap-2 w-32 shrink-0 min-w-0">
                        <Avatar name={m.nameA} />
                        <span className="text-sm font-medium truncate">{m.nameA}</span>
                      </div>

                      {/* Score bar */}
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-semibold ${color}`}>{label}</span>
                          <span className="text-muted-foreground font-medium">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Person B */}
                      <div className="flex items-center gap-2 w-32 shrink-0 min-w-0 justify-end">
                        <span className="text-sm font-medium truncate text-right">{m.nameB}</span>
                        <Avatar name={m.nameB} />
                      </div>

                      {/* Zone */}
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

          {/* Zone assignment + deliver + re-run */}
          {event.status === "matched" && (
            <div className="space-y-3">
              {/* Meeting zones */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">Meeting zones</CardTitle>
                        <span className="text-xs text-muted-foreground border rounded-full px-2 py-0.5">optional</span>
                      </div>
                      <CardDescription>
                        {assignedZones.length > 0
                          ? `${assignedZones.length} zone${assignedZones.length !== 1 ? "s" : ""} · ~${Math.ceil(matchRows.length / assignedZones.length)} pairs each`
                          : "Add zone names to tell attendees where to meet their match."}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form action={saveEventZones.bind(null, id)} className="space-y-3">
                    <Textarea
                      name="zones"
                      placeholder={"Zone A\nZone B\nZone C"}
                      defaultValue={assignedZones.join("\n")}
                      rows={4}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      One zone per line. {matchRows.length} pairs will be distributed evenly across however many zones you enter. Leave blank to clear zones.
                    </p>
                    <Button type="submit" size="sm" variant="outline">
                      Assign zones
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Deliver */}
              <Card className="border-foreground/20 bg-foreground text-background">
                <CardContent className="pt-5 pb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">Ready to deliver</p>
                    <p className="text-sm text-background/60 mt-0.5">
                      Attendees will see their matches on their confirmation page.
                    </p>
                  </div>
                  <DeliverResultsButton eventId={id} />
                </CardContent>
              </Card>

              <div className="rounded-lg border border-dashed p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Re-run matching</p>
                  <p className="text-xs text-muted-foreground">
                    This will replace all existing pairs.
                  </p>
                </div>
                <RunMatchingButton eventId={id} />
              </div>
            </div>
          )}

          {event.status === "delivered" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Send className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">Results delivered</p>
                <p className="text-xs text-emerald-700">
                  Attendees can view their matches on their confirmation page.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
