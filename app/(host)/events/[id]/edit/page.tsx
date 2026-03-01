import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { EditEventForm } from "./edit-event-form";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditEventPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.hostId, user!.id)));

  if (!event) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to event
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit event</h1>
        <p className="text-sm text-muted-foreground mt-1">{event.name}</p>
      </div>

      <EditEventForm event={event} error={error} />
    </div>
  );
}
