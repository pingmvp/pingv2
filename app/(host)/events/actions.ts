"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, questions, attendees, responses } from "@/lib/db/schema";
import { createEventSchema, updateEventSchema } from "@/lib/validators/event";
import { eq, and, inArray } from "drizzle-orm";

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

export async function updateEvent(eventId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    date: formData.get("date") || undefined,
    location: formData.get("location") || undefined,
    matchCount: formData.get("matchCount") ? Number(formData.get("matchCount")) : undefined,
    matchingMode: formData.get("matchingMode") || undefined,
  };

  const parsed = updateEventSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    redirect(`/events/${eventId}/edit?error=${encodeURIComponent(msg)}`);
  }

  await db
    .update(events)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(events.id, eventId), eq(events.hostId, user.id)));

  redirect(`/events/${eventId}`);
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

const SEED_NAMES = [
  ["Alice", "Morgan"], ["Bob", "Chen"], ["Carol", "Rivera"], ["David", "Kim"],
  ["Eva", "Patel"], ["Frank", "Osei"], ["Grace", "Tanaka"], ["Henry", "Müller"],
  ["Iris", "Santos"], ["Jack", "Novak"], ["Karen", "Ali"], ["Leo", "Petrov"],
  ["Maya", "Lindqvist"], ["Noah", "Okonkwo"], ["Olivia", "Reyes"], ["Paul", "Zhang"],
  ["Quinn", "Ferreira"], ["Rosa", "Björk"], ["Sam", "Nakamura"], ["Tara", "Wallace"],
];

export async function archiveEvent(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [event] = await db
    .select({ id: events.id, status: events.status })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.hostId, user.id)));

  if (!event) return;
  if (event.status !== "matched" && event.status !== "delivered") return;

  // Get all attendee IDs for this event
  const eventAttendees = await db
    .select({ id: attendees.id })
    .from(attendees)
    .where(eq(attendees.eventId, eventId));

  // Delete all questionnaire responses (bulk data, no longer needed)
  if (eventAttendees.length > 0) {
    await db
      .delete(responses)
      .where(inArray(responses.attendeeId, eventAttendees.map((a) => a.id)));
  }

  // Null out phone numbers — the only PII we hold on attendees
  await db
    .update(attendees)
    .set({ phone: null })
    .where(eq(attendees.eventId, eventId));

  await db
    .update(events)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(events.id, eventId));

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
}

export async function deleteAttendee(attendeeId: string, eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify the event belongs to this host before deleting
  const [event] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.hostId, user.id)));

  if (!event) return;

  await db
    .delete(attendees)
    .where(and(eq(attendees.id, attendeeId), eq(attendees.eventId, eventId)));

  revalidatePath(`/events/${eventId}`);
}

export async function seedTestAttendees(eventId: string, formData: FormData) {
  if (process.env.NODE_ENV !== "development") throw new Error("Dev only");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const count = Math.min(50, Math.max(1, Number(formData.get("count") ?? 10)));

  // Owner check
  const [event] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.hostId, user.id)));
  if (!event) redirect("/dashboard");

  const eventQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.eventId, eventId));

  const ts = Date.now().toString().slice(-6);
  const newAttendees = Array.from({ length: count }, (_, i) => {
    const [first, last] = SEED_NAMES[i % SEED_NAMES.length];
    return {
      eventId,
      name: `${first} ${last}`,
      phone: `+1555${ts}${String(i).padStart(2, "0")}`,
      token: randomUUID(),
    };
  });

  const inserted = await db.insert(attendees).values(newAttendees).returning({ id: attendees.id });

  if (eventQuestions.length > 0) {
    const allResponses = inserted.flatMap(({ id: attendeeId }) =>
      eventQuestions.map((q) => {
        let value: string | string[] | number;
        if (q.type === "single_choice" && q.options?.length) {
          value = q.options[Math.floor(Math.random() * q.options.length)];
        } else if (q.type === "multiple_choice" && q.options?.length) {
          const shuffled = [...q.options].sort(() => Math.random() - 0.5);
          value = shuffled.slice(0, Math.ceil(Math.random() * q.options.length));
        } else {
          // scale
          const min = q.scaleMin ?? 1;
          const max = q.scaleMax ?? 10;
          value = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        return { attendeeId, questionId: q.id, value };
      })
    );
    await db.insert(responses).values(allResponses);
  }

  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}`);
}
