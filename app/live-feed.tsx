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
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
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
        const matchEntry =
          next % 5 === 0
            ? {
                id: next * 100,
                label: `${POOL[next % POOL.length].name.split(" ")[0]} ↔ ${POOL[(next + 3) % POOL.length].name.split(" ")[0]} · ${Math.floor(Math.random() * 10) + 88}% compat.`,
              }
            : null;
        return {
          entries:
            prev.entries.length < 10
              ? [...prev.entries, { id: next, ...person }]
              : prev.entries,
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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Once done, pause 4s then reset
  useEffect(() => {
    if (!state.done) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const timeout = setTimeout(() => {
      setState(initialState());
      start();
    }, 4000);
    return () => clearTimeout(timeout);
  }, [state.done]);

  return (
    <div className="flex justify-center lg:justify-end">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-3 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">TechConnect 2025</p>
            <p className="text-sm font-semibold text-white mt-0.5">
              {state.done ? "Matching complete" : "Live questionnaire"}
            </p>
          </div>
          {state.done ? (
            <div className="flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/30 px-2.5 py-1">
              <Zap className="w-3 h-3 text-primary" strokeWidth={2.5} />
              <span className="text-xs font-medium text-primary">Done</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Live</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
          <Users className="w-4 h-4 text-white/30" />
          <span className="text-sm text-white/50"><span className="text-white font-semibold">{state.count}</span> responses collected</span>
        </div>

        <div ref={feedRef} className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-none"  style={{ scrollBehavior: "smooth" }}>
          {state.entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 animate-in slide-in-from-bottom-3 fade-in duration-500"
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {entry.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{entry.name}</p>
                <p className="text-[10px] text-white/40 truncate">{entry.role}</p>
              </div>
              <span className="ml-auto text-[10px] text-emerald-400 shrink-0">Just joined</span>
            </div>
          ))}
          {state.matchEntry && (
            <div
              key={state.matchEntry.id}
              className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2.5 animate-in slide-in-from-bottom-3 fade-in duration-500"
            >
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-primary">Match found!</p>
                <p className="text-[10px] text-white/50 truncate">{state.matchEntry.label}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px] text-white/30">
            <span>Response target</span>
            <span>{state.count} / {TARGET}</span>
          </div>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min((state.count / TARGET) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
