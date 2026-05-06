"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { Calendar, MapPin, Users, ChevronRight, Plus, Zap, Pencil, X, Archive, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveEvents, deleteEvents } from "@/app/(host)/events/actions";

type EventStatus = "draft" | "open" | "closed" | "matched" | "delivered" | "archived";

interface Event {
  id: string;
  name: string;
  status: string;
  date: Date | null;
  location: string | null;
  createdAt: Date;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; leftBorder: string }> = {
  draft: { label: "Draft", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600", leftBorder: "border-l-slate-300" },
  open: { label: "Open", dot: "bg-emerald-500 animate-pulse", badge: "bg-emerald-50 text-emerald-700", leftBorder: "border-l-emerald-400" },
  closed: { label: "Closed", dot: "bg-blue-400", badge: "bg-blue-50 text-blue-700", leftBorder: "border-l-blue-400" },
  matched: { label: "Matched", dot: "bg-violet-500", badge: "bg-violet-50 text-violet-700", leftBorder: "border-l-violet-400" },
  delivered: { label: "Delivered", dot: "bg-teal-500", badge: "bg-teal-50 text-teal-700", leftBorder: "border-l-teal-400" },
  archived: { label: "Archived", dot: "bg-slate-300", badge: "bg-slate-100 text-slate-400", leftBorder: "border-l-slate-200" },
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

export function DashboardClient({ events, countMap }: Props) {
  const [activeFilter, setActiveFilter] = useState<"all" | EventStatus>("all");
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const filtered = activeFilter === "all" ? events : events.filter((e) => e.status === activeFilter);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((e) => e.id)));
    }
  }

  function exitEditMode() {
    setEditMode(false);
    setSelected(new Set());
  }

  function handleArchive() {
    if (selected.size === 0) return;
    const ids = [...selected];
    startTransition(async () => {
      await archiveEvents(ids);
      exitEditMode();
    });
  }

  function handleDelete() {
    if (selected.size === 0) return;
    const count = selected.size;
    if (!confirm(`Permanently delete ${count} event${count !== 1 ? "s" : ""}?\n\nAll attendees, responses, and match data will be deleted. This cannot be undone.`)) return;
    const ids = [...selected];
    startTransition(async () => {
      await deleteEvents(ids);
      exitEditMode();
    });
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {events.length === 0
              ? "Create your first event to get started."
              : `${events.length} event${events.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {events.length > 0 && (
            editMode ? (
              <Button variant="ghost" size="sm" onClick={exitEditMode} disabled={isPending}>
                <X className="w-4 h-4 mr-1.5" />
                Done
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                <Pencil className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
            )
          )}
          {!editMode && (
            <Button asChild>
              <Link href="/events/new" className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                New event
              </Link>
            </Button>
          )}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed p-16 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Zap className="w-7 h-7 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-base">No events yet</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Create an event, build your questions, and start matching attendees.
            </p>
          </div>
          <Button asChild>
            <Link href="/events/new" className="inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Create your first event
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filter tabs + select-all row */}
          <div className="flex items-center justify-between gap-2">
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
            {editMode && filtered.length > 0 && (
              <button
                onClick={toggleAll}
                className="shrink-0 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${allSelected ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
                  {allSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />}
                </span>
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            )}
          </div>

          {/* Event grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((event) => {
              const cfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.draft;
              const responseCount = countMap[event.id] ?? 0;
              const isSelected = selected.has(event.id);

              if (editMode) {
                return (
                  <button
                    key={event.id}
                    onClick={() => toggleSelect(event.id)}
                    className={`group relative block w-full text-left rounded-xl border border-l-4 ${cfg.leftBorder} bg-card p-5 transition-all duration-200 ${
                      isSelected ? "ring-2 ring-primary shadow-md" : "hover:shadow-md"
                    }`}
                  >
                    {/* Checkbox */}
                    <span className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "bg-primary border-primary" : "border-muted-foreground/30 bg-background"
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                    </span>

                    <div className="flex items-center justify-between mb-4 pr-6">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>

                    <h2 className="font-semibold text-base leading-snug mb-3">{event.name}</h2>

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
                        {responseCount} {responseCount === 1 ? "response" : "responses"}
                      </span>
                    </div>
                  </button>
                );
              }

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
                      {responseCount} {responseCount === 1 ? "response" : "responses"}
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

          {/* Edit mode action bar */}
          {editMode && (
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-200 ${selected.size > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
              <div className="flex items-center gap-2 bg-background border rounded-xl shadow-xl px-4 py-3">
                <span className="text-sm font-medium text-muted-foreground mr-1">
                  {selected.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleArchive}
                  disabled={isPending}
                >
                  <Archive className="w-3.5 h-3.5 mr-1.5" />
                  Archive
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
