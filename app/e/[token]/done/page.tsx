import { db } from "@/lib/db";
import { attendees, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Zap } from "lucide-react";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ConfirmationPage({ params }: Props) {
  const { token } = await params;

  const [attendee] = await db
    .select()
    .from(attendees)
    .where(eq(attendees.token, token));

  const eventInfo = attendee
    ? await db
        .select({ name: events.name, matchCount: events.matchCount })
        .from(events)
        .where(eq(events.id, attendee.eventId))
        .then((r) => r[0])
    : null;

  const firstName = attendee?.name.split(" ")[0] ?? "You";
  const matchCount = eventInfo?.matchCount ?? 3;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      {/* Branding */}
      <div className="absolute top-5 left-6 flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-background" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-bold tracking-tight">Ping</span>
      </div>

      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center">
            <Zap className="w-10 h-10 text-emerald-600" strokeWidth={2} />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            You&apos;re in, {firstName}!
          </h1>
          {eventInfo && (
            <p className="text-muted-foreground leading-relaxed">
              You&apos;re registered for{" "}
              <span className="font-semibold text-foreground">{eventInfo.name}</span>.
            </p>
          )}
          <p className="text-muted-foreground leading-relaxed">
            We&apos;ll text you your top{" "}
            <span className="font-semibold text-foreground">
              {matchCount} {matchCount === 1 ? "match" : "matches"}
            </span>{" "}
            before the event starts. Keep an eye on your messages.
          </p>
        </div>

        {/* Divider */}
        <div className="rounded-xl border bg-muted/40 px-5 py-4 text-sm text-muted-foreground text-left space-y-2">
          <p className="font-semibold text-foreground text-sm">What happens next?</p>
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-foreground font-bold shrink-0">1.</span>
              We run the matching algorithm before the event.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-bold shrink-0">2.</span>
              You get a text with your matches — name and something to talk about.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-bold shrink-0">3.</span>
              Find them at the event and make the connection.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
