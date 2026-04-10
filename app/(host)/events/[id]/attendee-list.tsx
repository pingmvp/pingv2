"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { DeleteAttendeeButton } from "./delete-attendee-button";

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

interface Attendee {
  id: string;
  name: string;
  createdAt: Date;
}

interface Props {
  attendees: Attendee[];
  eventId: string;
  defaultVisible?: number;
}

export function AttendeeList({ attendees, eventId, defaultVisible = 8 }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? attendees : attendees.slice(0, defaultVisible);
  const hidden = attendees.length - defaultVisible;

  if (attendees.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No attendees yet</p>
        <p className="text-xs text-muted-foreground mt-1">Share the attendee link to start collecting responses</p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-0.5">
        {visible.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(a.name)}`}>
                {a.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium truncate">{a.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                <DeleteAttendeeButton attendeeId={a.id} eventId={eventId} name={a.name} />
              </span>
            </div>
          </li>
        ))}
      </ul>

      {attendees.length > defaultVisible && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 rounded-lg hover:bg-muted/50"
        >
          {expanded ? "Show less" : `Show ${hidden} more`}
        </button>
      )}
    </>
  );
}
