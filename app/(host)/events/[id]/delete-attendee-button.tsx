"use client";

import { Trash2 } from "lucide-react";
import { deleteAttendee } from "../actions";

interface Props {
  attendeeId: string;
  eventId: string;
  name: string;
}

export function DeleteAttendeeButton({ attendeeId, eventId, name }: Props) {
  return (
    <form
      action={deleteAttendee.bind(null, attendeeId, eventId)}
      onSubmit={(e) => {
        if (!confirm(`Remove ${name}? This will delete their responses and any associated match data.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        aria-label={`Remove ${name}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}
