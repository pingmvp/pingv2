"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deliverResults } from "../../actions";

export function DeliverResultsButton({ eventId }: { eventId: string }) {
  return (
    <form
      action={deliverResults.bind(null, eventId)}
      onSubmit={(e) => {
        const confirmed = confirm(
          "Deliver matches to all attendees?\n\n" +
          "Their matches will become visible on their confirmation page. " +
          "This cannot be undone."
        );
        if (!confirmed) e.preventDefault();
      }}
    >
      <Button type="submit" size="lg" className="gap-2">
        <Send className="w-4 h-4" />
        Deliver results
      </Button>
    </form>
  );
}
