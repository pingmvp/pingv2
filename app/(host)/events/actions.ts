"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { createEventSchema } from "@/lib/validators/event";
import { eq, and } from "drizzle-orm";

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    date: formData.get("date") || undefined,
    location: formData.get("location") || undefined,
    matchCount: Number(formData.get("matchCount") ?? 3),
    matchingMode: formData.get("matchingMode") ?? "general",
  };

  const parsed = createEventSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    redirect(`/events/new?error=${encodeURIComponent(msg)}`);
  }

  const [event] = await db
    .insert(events)
    .values({ ...parsed.data, hostId: user.id })
    .returning();

  redirect(`/events/${event.id}`);
}

export async function openEvent(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await db
    .update(events)
    .set({ status: "open", updatedAt: new Date() })
    .where(and(eq(events.id, eventId), eq(events.hostId, user.id)));

  redirect(`/events/${eventId}`);
}

export async function closeEvent(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await db
    .update(events)
    .set({ status: "closed", updatedAt: new Date() })
    .where(and(eq(events.id, eventId), eq(events.hostId, user.id)));

  redirect(`/events/${eventId}`);
}
