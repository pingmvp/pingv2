import Link from "next/link";
import { NewEventForm } from "./new-event-form";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewEventPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block"
      >
        ← Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">New event</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Set up your event. You'll add matching questions on the next step.
        </p>
      </div>

      <NewEventForm error={error} />
    </div>
  );
}
