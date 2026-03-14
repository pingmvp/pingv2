import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, attendees } from "@/lib/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { LobbyScreen } from "./lobby-screen";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LobbyPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [event] = await db
    .select({ id: events.id, name: events.name, status: events.status })
    .from(events)
    .where(and(eq(events.id, id), eq(events.hostId, user!.id)));

  if (!event) notFound();

  const attendeeList = await db
    .select({ id: attendees.id, name: attendees.name, createdAt: attendees.createdAt })
    .from(attendees)
    .where(eq(attendees.eventId, id))
    .orderBy(asc(attendees.createdAt));

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const attendeeUrl = `${protocol}://${host}/e/${id}`;

  return (
    <LobbyScreen
      eventId={id}
      eventName={event.name}
      attendeeUrl={attendeeUrl}
      initial={{ status: event.status, attendees: attendeeList }}
    />
  );
}
