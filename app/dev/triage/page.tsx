import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  events,
  questions,
  groups,
  attendees,
  responses,
  matches,
  feedback,
} from "@/lib/db/schema";
import { asc, desc } from "drizzle-orm";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(new Date(d as string));
}

function similarityMethod(q: { type: string; options?: string[] | null }): {
  label: string;
  detail: string;
} {
  if (q.type === "single_choice") {
    return (q.options?.length ?? 0) > 1
      ? { label: "ordinal", detail: "adjacent options score closer to 1" }
      : { label: "exact", detail: "same answer = 1, different = 0" };
  }
  if (q.type === "multiple_choice")
    return { label: "jaccard", detail: "|A∩B| / |A∪B|" };
  if (q.type === "scale")
    return { label: "proximity", detail: "1 − |a−b| / range" };
  return { label: "—", detail: "" };
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

const STATUS_STYLE: Record<string, string> = {
  draft:     "bg-zinc-700 text-zinc-300",
  open:      "bg-emerald-900 text-emerald-300",
  closed:    "bg-amber-900 text-amber-300",
  matched:   "bg-blue-900 text-blue-300",
  delivered: "bg-purple-900 text-purple-300",
  archived:  "bg-zinc-800 text-zinc-500",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TriagePage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const [
    allEvents,
    allQuestions,
    allGroups,
    allAttendees,
    allResponses,
    allMatches,
    allFeedback,
  ] = await Promise.all([
    db.select().from(events).orderBy(desc(events.createdAt)),
    db.select().from(questions).orderBy(asc(questions.order)),
    db.select().from(groups),
    db.select().from(attendees).orderBy(desc(attendees.createdAt)),
    db.select().from(responses),
    db.select().from(matches).orderBy(desc(matches.createdAt)),
    db.select().from(feedback).orderBy(desc(feedback.createdAt)),
  ]);

  // ── Index maps ──────────────────────────────────────────────────────────────

  const questionsByEvent: Record<string, typeof allQuestions> = {};
  for (const q of allQuestions) (questionsByEvent[q.eventId] ??= []).push(q);

  const groupsByEvent: Record<string, typeof allGroups> = {};
  for (const g of allGroups) (groupsByEvent[g.eventId] ??= []).push(g);

  const attendeesByEvent: Record<string, typeof allAttendees> = {};
  for (const a of allAttendees) (attendeesByEvent[a.eventId] ??= []).push(a);

  const responsesByAttendee: Record<string, typeof allResponses> = {};
  for (const r of allResponses) (responsesByAttendee[r.attendeeId] ??= []).push(r);

  const matchesByEvent: Record<string, typeof allMatches> = {};
  for (const m of allMatches) (matchesByEvent[m.eventId] ??= []).push(m);

  const feedbackByMatch: Record<string, typeof allFeedback> = {};
  for (const f of allFeedback) (feedbackByMatch[f.matchId] ??= []).push(f);

  const attendeeMap = Object.fromEntries(allAttendees.map((a) => [a.id, a]));
  const questionMap = Object.fromEntries(allQuestions.map((q) => [q.id, q]));

  const renderTime = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 text-sm font-mono">

      {/* ── Sticky dev banner ── */}
      <div className="sticky top-0 z-50 flex items-center gap-2 bg-amber-400 px-6 py-2 text-xs font-bold text-amber-950">
        <span className="text-sm">⚠</span>
        <span className="uppercase tracking-widest">Dev Triage</span>
        <span className="text-amber-600 mx-1">·</span>
        <span className="font-normal tracking-normal text-amber-800">localhost only · notFound() in production</span>
        <span className="ml-auto font-normal tracking-normal text-amber-700">{renderTime}</span>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-10">

        {/* ── Global counters ── */}
        <div>
          <h1 className="text-lg font-bold text-white mb-4">Database Overview</h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(
              [
                ["Events",     allEvents.length,     "bg-zinc-800"],
                ["Questions",  allQuestions.length,  "bg-zinc-800"],
                ["Attendees",  allAttendees.length,  "bg-zinc-800"],
                ["Responses",  allResponses.length,  "bg-zinc-800"],
                ["Matches",    allMatches.length,    "bg-zinc-800"],
                ["Feedback",   allFeedback.length,   "bg-zinc-800"],
              ] as [string, number, string][]
            ).map(([label, value, bg]) => (
              <div key={label} className={`rounded-lg border border-zinc-800 ${bg} px-4 py-3`}>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Event breakdown ── */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            All Events — newest first
          </h2>
        </div>

        {allEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-16 text-center text-zinc-600">
            No events in database yet.
          </div>
        ) : (
          allEvents.map((event) => {
            const qs = questionsByEvent[event.id] ?? [];
            const gs = groupsByEvent[event.id] ?? [];
            const as = attendeesByEvent[event.id] ?? [];
            const ms = matchesByEvent[event.id] ?? [];
            const totalResponses = as.reduce(
              (sum, a) => sum + (responsesByAttendee[a.id]?.length ?? 0), 0
            );
            const totalFeedback = ms.reduce(
              (sum, m) => sum + (feedbackByMatch[m.id]?.length ?? 0), 0
            );

            return (
              <div key={event.id} className="rounded-xl border border-zinc-800 overflow-hidden">

                {/* ── Event header ── */}
                <div className="bg-zinc-900 px-6 py-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-base font-bold text-white">{event.name}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLE[event.status] ?? "bg-zinc-700 text-zinc-300"}`}>
                          {event.status}
                        </span>
                        <span className="text-[10px] border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">
                          {event.matchingMode}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {event.matchCount} match{event.matchCount !== 1 ? "es" : ""}/attendee
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-zinc-400 text-xs">{event.description}</p>
                      )}
                    </div>
                    {/* Quick counts */}
                    <div className="flex gap-3 text-[10px] text-zinc-600 shrink-0">
                      {([["Q", qs.length], ["A", as.length], ["R", totalResponses], ["M", ms.length], ["FB", totalFeedback]] as [string, number][]).map(([l, v]) => (
                        <div key={l} className="text-center">
                          <div className="text-white font-bold text-sm">{v}</div>
                          <div>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-zinc-500 border-t border-zinc-800 pt-3">
                    <span><span className="text-zinc-600">id </span>{event.id}</span>
                    <span><span className="text-zinc-600">host </span>{event.hostId}</span>
                    <span><span className="text-zinc-600">created </span>{fmt(event.createdAt)}</span>
                    <span><span className="text-zinc-600">updated </span>{fmt(event.updatedAt)}</span>
                    {event.date && <span><span className="text-zinc-600">event date </span>{fmt(event.date)}</span>}
                    {event.deliveryTime && <span><span className="text-zinc-600">delivery </span>{fmt(event.deliveryTime)}</span>}
                    {event.location && <span><span className="text-zinc-600">location </span>{event.location}</span>}
                    {(event.zones ?? []).length > 0 && (
                      <span><span className="text-zinc-600">zones </span>{(event.zones ?? []).join(", ")}</span>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-zinc-800/60">

                  {/* ── Groups (two-sided) ── */}
                  {gs.length > 0 && (
                    <section className="px-6 py-4">
                      <SectionLabel>Groups ({gs.length})</SectionLabel>
                      <div className="flex gap-3 flex-wrap">
                        {gs.map((g) => (
                          <div key={g.id} className="rounded border border-zinc-700 px-3 py-2 text-xs space-y-0.5">
                            <div className="font-semibold text-zinc-200">{g.name}</div>
                            <div className="text-zinc-600 text-[10px]">id: {g.id}</div>
                            {g.matchWithId && (
                              <div className="text-zinc-600 text-[10px]">matchWith: {g.matchWithId}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* ── Questions ── */}
                  <section className="px-6 py-4">
                    <SectionLabel>Questions ({qs.length})</SectionLabel>
                    {qs.length === 0 ? (
                      <Empty>No questions added</Empty>
                    ) : (
                      <table className="w-full text-xs border-separate border-spacing-0">
                        <thead>
                          <tr className="text-[10px] text-zinc-600">
                            <Th className="w-8">#</Th>
                            <Th>Text</Th>
                            <Th className="w-28">Type</Th>
                            <Th className="w-24">Method</Th>
                            <Th className="w-28">Weight</Th>
                            <Th>Options / Range</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {qs.map((q, i) => (
                            <tr key={q.id} className={i % 2 === 0 ? "" : "bg-zinc-900/30"}>
                              <Td muted>{q.order + 1}</Td>
                              <Td>
                                <span className="text-zinc-200">{q.text}</span>
                                <div className="text-[10px] text-zinc-700 mt-0.5">{q.id}</div>
                              </Td>
                              <Td muted>{q.type}</Td>
                              <Td>
                                {(() => {
                                  const { label, detail } = similarityMethod(q);
                                  const color =
                                    label === "exact"     ? "text-zinc-400" :
                                    label === "ordinal"   ? "text-blue-400" :
                                    label === "jaccard"   ? "text-purple-400" :
                                    label === "proximity" ? "text-emerald-400" : "text-zinc-600";
                                  return (
                                    <>
                                      <span className={`font-semibold ${color}`}>{label}</span>
                                      <div className="text-[10px] text-zinc-600 mt-0.5">{detail}</div>
                                    </>
                                  );
                                })()}
                              </Td>
                              <Td>
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-16 rounded-full bg-zinc-800">
                                    <div
                                      className="h-1.5 rounded-full bg-blue-500"
                                      style={{ width: `${(q.weight / 10) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-zinc-400">{q.weight}/10</span>
                                </div>
                              </Td>
                              <Td muted>
                                {q.type === "scale"
                                  ? `scale ${q.scaleMin}–${q.scaleMax}`
                                  : (q.options ?? []).join(" · ") || "—"}
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </section>

                  {/* ── Attendees + responses ── */}
                  <section className="px-6 py-4">
                    <SectionLabel>Attendees ({as.length}) + Responses</SectionLabel>
                    {as.length === 0 ? (
                      <Empty>No attendees yet</Empty>
                    ) : (
                      <div className="space-y-2">
                        {as.map((a) => {
                          const aResps = responsesByAttendee[a.id] ?? [];
                          const group = gs.find((g) => g.id === a.groupId);
                          return (
                            <div key={a.id} className="rounded-lg border border-zinc-800 overflow-hidden">
                              {/* Attendee header row */}
                              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
                                <span className="font-semibold text-white">{a.name}</span>
                                {a.email && <span className="text-zinc-400 text-xs">{a.email}</span>}
                                {group && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                    group: {group.name}
                                  </span>
                                )}
                                <span className="text-zinc-600 text-[10px]">id: {a.id}</span>
                                <span className="text-zinc-600 text-[10px]">token: {a.token}</span>
                                <span className="ml-auto text-zinc-600 text-[10px]">
                                  joined {fmt(a.createdAt)}
                                </span>
                              </div>

                              {/* Responses */}
                              {aResps.length > 0 ? (
                                <div className="px-4 py-2.5 space-y-1.5">
                                  {aResps.map((r) => {
                                    const q = questionMap[r.questionId];
                                    return (
                                      <div key={r.id} className="flex gap-3 text-xs">
                                        <span
                                          className="text-zinc-500 shrink-0 w-56 truncate"
                                          title={q?.text}
                                        >
                                          {q?.text ?? `q:${r.questionId.slice(0, 8)}`}
                                        </span>
                                        <span className="text-zinc-200 leading-snug">
                                          {renderValue(r.value)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="px-4 py-2 text-[10px] text-zinc-700 italic">
                                  no responses
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* ── Matches ── */}
                  <section className="px-6 py-4">
                    <SectionLabel>Matches ({ms.length})</SectionLabel>
                    {ms.length === 0 ? (
                      <Empty>Matching not run yet</Empty>
                    ) : (
                      <table className="w-full text-xs border-separate border-spacing-0">
                        <thead>
                          <tr className="text-[10px] text-zinc-600">
                            <Th className="w-20">Score</Th>
                            <Th>Attendee A</Th>
                            <Th className="w-14">Rank A</Th>
                            <Th>Attendee B</Th>
                            <Th className="w-14">Rank B</Th>
                            <Th className="w-20">Zone</Th>
                            <Th>Feedback</Th>
                            <Th className="w-40">Created</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {ms.map((m, i) => {
                            const a = attendeeMap[m.attendeeAId];
                            const b = attendeeMap[m.attendeeBId];
                            const fb = feedbackByMatch[m.id] ?? [];
                            const pct = Math.round(m.score * 100);
                            const scoreColor =
                              pct >= 80 ? "text-emerald-400"
                              : pct >= 60 ? "text-yellow-400"
                              : "text-red-400";
                            const barColor =
                              pct >= 80 ? "bg-emerald-500"
                              : pct >= 60 ? "bg-yellow-500"
                              : "bg-red-500";

                            return (
                              <tr key={m.id} className={i % 2 === 0 ? "" : "bg-zinc-900/30"}>
                                <Td>
                                  <span className={`font-bold ${scoreColor}`}>{pct}%</span>
                                  <div className="mt-1 h-1 w-14 rounded-full bg-zinc-800">
                                    <div
                                      className={`h-1 rounded-full ${barColor}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </Td>
                                <Td>
                                  <span className="text-zinc-200">{a?.name ?? "?"}</span>
                                  <div className="text-[10px] text-zinc-700">{m.attendeeAId.slice(0, 8)}</div>
                                </Td>
                                <Td muted>#{m.rankForA}</Td>
                                <Td>
                                  <span className="text-zinc-200">{b?.name ?? "?"}</span>
                                  <div className="text-[10px] text-zinc-700">{m.attendeeBId.slice(0, 8)}</div>
                                </Td>
                                <Td muted>#{m.rankForB}</Td>
                                <Td muted>{m.zone ?? "—"}</Td>
                                <Td>
                                  {fb.length === 0 ? (
                                    <span className="text-zinc-700 text-[10px]">none</span>
                                  ) : (
                                    <div className="space-y-0.5">
                                      {fb.map((f) => {
                                        const rater = attendeeMap[f.attendeeId];
                                        return (
                                          <div key={f.id} className="flex items-center gap-1.5 text-[10px]">
                                            <span>{f.rating === "positive" ? "👍" : "👎"}</span>
                                            <span className="text-zinc-400">{rater?.name ?? "?"}</span>
                                            <span className="text-zinc-700">{fmt(f.createdAt)}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </Td>
                                <Td muted className="text-[10px]">{fmt(m.createdAt)}</Td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </section>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Small presentational components ──────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-zinc-700 text-xs italic">{children}</p>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`pb-2 pr-4 text-left font-medium text-zinc-600 text-[10px] ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  muted = false,
  className = "",
}: {
  children?: React.ReactNode;
  muted?: boolean;
  className?: string;
}) {
  return (
    <td className={`py-2 pr-4 align-top ${muted ? "text-zinc-500" : "text-zinc-300"} ${className}`}>
      {children}
    </td>
  );
}
