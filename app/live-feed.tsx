"use client";
import { useEffect, useRef, useState } from "react";
import { Users, Zap } from "lucide-react";

const POOL = [
  { name: "Sarah M.", role: "Founder · B2B SaaS" },
  { name: "Alex K.", role: "Investor · Early Stage" },
  { name: "Jordan L.", role: "Engineer · Fintech" },
  { name: "Priya S.", role: "Designer · Product" },
  { name: "Marcus T.", role: "PM · Enterprise" },
  { name: "Nina R.", role: "VC · Series A" },
  { name: "Tom B.", role: "CTO · Dev Tools" },
  { name: "Aisha J.", role: "Founder · Climate" },
];

const TARGET = 50;
const START = 24;

type Entry = { id: number; name: string; role: string };

function initialState() {
  return {
    entries: POOL.slice(0, 3).map((p, i) => ({ id: i, ...p })) as Entry[],
    count: START,
    matchEntry: null as { id: number; label: string } | null,
    tick: 3,
    done: false,
  };
}

export default function LiveFeed() {
  const [state, setState] = useState(initialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [state.entries.length]);

  function start() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.done) return prev;
        const next = prev.tick + 1;
        const person = POOL[next % POOL.length];
        const newCount = prev.count + 1;
        const done = newCount >= TARGET;
        const matchEntry = next % 5 === 0
          ? { id: next * 100, label: `${POOL[next % POOL.length].name.split(" ")[0]} ↔ ${POOL[(next + 3) % POOL.length].name.split(" ")[0]} · ${Math.floor(Math.random() * 10) + 88}% compat.` }
          : null;
        return {
          entries: prev.entries.length < 10 ? [...prev.entries, { id: next, ...person }] : prev.entries,
          count: newCount,
          matchEntry,
          tick: next,
          done,
        };
      });
    }, 1800);
  }

  useEffect(() => {
    start();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (!state.done) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const timeout = setTimeout(() => { setState(initialState()); start(); }, 4000);
    return () => clearTimeout(timeout);
  }, [state.done]);

  return (
    <div className="flex justify-center lg:justify-end">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-card p-5 space-y-3" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">TechConnect 2025</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {state.done ? "Matching complete" : "Live questionnaire"}
            </p>
          </div>
          {state.done ? (
            <div className="flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1">
              <Zap className="w-3 h-3 text-background" strokeWidth={2.5} />
              <span className="text-xs font-medium text-background">Done</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">Live</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-black/5 border border-black/8 px-3 py-2">
          <Users className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">{state.count}</span> responses collected
          </span>
        </div>

        <div ref={feedRef} className="space-y-2 max-h-[260px] overflow-y-auto scrollbar-none" style={{ scrollBehavior: "smooth" }}>
          {state.entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-xl border border-black/8 bg-background px-3 py-2.5 animate-in slide-in-from-bottom-3 fade-in duration-500"
            >
              <div className="w-7 h-7 rounded-full bg-foreground/10 border border-black/8 flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                {entry.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{entry.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{entry.role}</p>
              </div>
              <span className="ml-auto text-[10px] text-emerald-600 font-medium shrink-0">Just joined</span>
            </div>
          ))}
          {state.matchEntry && (
            <div
              key={state.matchEntry.id}
              className="flex items-center gap-3 rounded-xl border border-black/15 bg-foreground px-3 py-2.5 animate-in slide-in-from-bottom-3 fade-in duration-500"
            >
              <div className="w-7 h-7 rounded-full bg-background/20 flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 text-background" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-background">Match found!</p>
                <p className="text-[10px] text-background/60 truncate">{state.matchEntry.label}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Response target</span>
            <span>{state.count} / {TARGET}</span>
          </div>
          <div className="h-1.5 rounded-full bg-black/8 overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min((state.count / TARGET) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
