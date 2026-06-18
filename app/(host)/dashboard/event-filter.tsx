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
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  draft:     { label: "Draft",     dot: "bg-gray-400",     badge: "bg-gray-100 text-gray-600 border-gray-200" },
  open:      { label: "Open",      dot: "bg-emerald-500 animate-pulse", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed:    { label: "Closed",    dot: "bg-blue-500",     badge: "bg-blue-50 text-blue-700 border-blue-200" },
  matched:   { label: "Matched",   dot: "bg-violet-500",   badge: "bg-violet-50 text-violet-700 border-violet-200" },
  delivered: { label: "Delivered", dot: "bg-teal-500",     badge: "bg-teal-50 text-teal-700 border-teal-200" },
  archived:  { label: "Archived",  dot: "bg-gray-300",     badge: "bg-gray-50 text-gray-400 border-gray-200" },
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
  const filtered = activeFilter === "all" ? events : events.filter((e) => e.status === activeFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`shrink-0 h-8 px-4 rounded-full text-sm font-medium transition-all duration-150 ${
              activeFilter === value
                ? "bg-foreground text-background"
                : "bg-black/5 text-muted-foreground hover:bg-black/8 hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((event) => {
          const cfg = STATUS_CONFIG[event.status];
          const responseCount = countMap[event.id] ?? 0;

          return (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group block rounded-2xl border border-black/8 bg-card p-5 hover:border-black/16 hover:-translate-y-0.5 transition-all duration-200"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                  {cfg.label}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>

              <h2 className="text-[15px] font-semibold text-foreground leading-snug mb-3 group-hover:opacity-70 transition-opacity">
                {event.name}
              </h2>

              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-4">
                {event.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                    {formatDate(event.date)}
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                    {event.location}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-black/8 pt-3">
                <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{responseCount} {responseCount === 1 ? "response" : "responses"}</span>
                {event.status === "open" && (
                  <span className="ml-auto text-emerald-600 font-medium flex items-center gap-1">
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
