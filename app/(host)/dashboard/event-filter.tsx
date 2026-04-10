"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";

type EventStatus = "draft" | "open" | "closed" | "matched" | "delivered" | "archived";

interface Event {
  id: string;
  name: string;
  status: string;
  date: Date | null;
  location: string | null;
  createdAt: Date;
}

interface StatusConfig {
  label: string;
  dot: string;
  badge: string;
  leftBorder: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: {
    label: "Draft",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-600",
    leftBorder: "border-l-slate-300",
  },
  open: {
    label: "Open",
    dot: "bg-emerald-500 animate-pulse",
    badge: "bg-emerald-50 text-emerald-700",
    leftBorder: "border-l-emerald-400",
  },
  closed: {
    label: "Closed",
    dot: "bg-blue-400",
    badge: "bg-blue-50 text-blue-700",
    leftBorder: "border-l-blue-400",
  },
  matched: {
    label: "Matched",
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700",
    leftBorder: "border-l-violet-400",
  },
  delivered: {
    label: "Delivered",
    dot: "bg-teal-500",
    badge: "bg-teal-50 text-teal-700",
    leftBorder: "border-l-teal-400",
  },
  archived: {
    label: "Archived",
    dot: "bg-slate-300",
    badge: "bg-slate-100 text-slate-400",
    leftBorder: "border-l-slate-200",
  },
};

const FILTER_OPTIONS: Array<{ value: "all" | EventStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "matched", label: "Matched" },
  { value: "delivered", label: "Delivered" },
];

interface Props {
  events: Event[];
  countMap: Record<string, number>;
}

export function EventFilter({ events, countMap }: Props) {
  const [activeFilter, setActiveFilter] = useState<"all" | EventStatus>("all");

  const filtered = activeFilter === "all"
    ? events
    : events.filter((e) => e.status === activeFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`shrink-0 px-3 py-1.5 rounded-md text-sm transition-colors ${
              activeFilter === value
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((event) => {
          const cfg = STATUS_CONFIG[event.status];
          const responseCount = countMap[event.id] ?? 0;

          return (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className={`group relative block rounded-xl border border-l-4 ${cfg.leftBorder} bg-card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                  {cfg.label}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>

              <h2 className="font-semibold text-base leading-snug mb-3 group-hover:text-primary transition-colors">
                {event.name}
              </h2>

              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-4">
                {event.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {formatDate(event.date)}
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {event.location}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-sm border-t pt-3">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {responseCount}{" "}
                  {responseCount === 1 ? "response" : "responses"}
                </span>
                {event.status === "open" && (
                  <span className="ml-auto text-xs font-medium text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
