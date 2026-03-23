"use client";

import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveEvent } from "../actions";

export function ArchiveEventButton({ eventId }: { eventId: string }) {
  return (
    <form
      action={archiveEvent.bind(null, eventId)}
      onSubmit={(e) => {
        const confirmed = confirm(
          "Archive this event?\n\n" +
          "This will permanently:\n" +
          "• Delete all attendee questionnaire responses\n" +
          "• Remove all attendee email addresses\n\n" +
          "Attendee names and match scores will be retained.\n\n" +
          "This cannot be undone."
        );
        if (!confirmed) e.preventDefault();
      }}
    >
      <Button type="submit" variant="outline" size="sm" className="text-muted-foreground">
        <Archive className="w-3.5 h-3.5 mr-1.5" />
        Archive event
      </Button>
    </form>
  );
}
