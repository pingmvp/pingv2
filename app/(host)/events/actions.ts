"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events, questions, attendees, responses, groups, matches } from "@/lib/db/schema";
import { createEventSchema, updateEventSchema } from "@/lib/validators/event";
import { eq, and, inArray, sql, asc } from "drizzle-orm";

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

  // Create groups for two_sided events
  if (parsed.data.matchingMode === "two_sided") {
    const nameA = (formData.get("groupA") as string)?.trim() || "Group A";
    const nameB = (formData.get("groupB") as string)?.trim() || "Group B";
    const [gA] = await db.insert(groups).values({ eventId: event.id, name: nameA }).returning();
    const [gB] = await db.insert(groups).values({ eventId: event.id, name: nameB, matchWithId: gA.id }).returning();
    await db.update(groups).set({ matchWithId: gB.id }).where(eq(groups.id, gA.id));
  }

  const questionsRaw = formData.get("questions");
  if (questionsRaw) {
    type DraftQuestion = {
      text: string;
      type: "single_choice" | "multiple_choice" | "scale";
      options: string[] | null;
      weight: number;
      scaleMin: number | null;
      scaleMax: number | null;
      order: number;
    };
    const draftQs = JSON.parse(questionsRaw as string) as DraftQuestion[];
    if (draftQs.length > 0) {
      await db.insert(questions).values(
        draftQs.map((q, i) => ({
          eventId: event.id,
          text: q.text,
          type: q.type,
          options: q.options ?? undefined,
          weight: q.weight,
          scaleMin: q.scaleMin ?? 1,
          scaleMax: q.scaleMax ?? 10,
          order: i,
        }))
      );
    }
  }

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

export async function saveEventZones(eventId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [event] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.hostId, user.id)));
  if (!event) return;

  const zonesRaw = (formData.get("zones") as string)?.trim() ?? "";
  const zoneNames = zonesRaw.split("\n").map((z) => z.trim()).filter(Boolean);

  // Save zone names at the event level
  await db
    .update(events)
    .set({ zones: zoneNames.length > 0 ? zoneNames : null, updatedAt: new Date() })
    .where(eq(events.id, eventId));

  // If matches exist, redistribute them across the new zones
  const eventMatches = await db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.eventId, eventId))
    .orderBy(asc(matches.score));

  if (eventMatches.length > 0) {
    if (zoneNames.length === 0) {
      await db.update(matches).set({ zone: sql`NULL` }).where(eq(matches.eventId, eventId));
    } else {
      await Promise.all(
        eventMatches.map((m, i) =>
          db.update(matches)
            .set({ zone: zoneNames[i % zoneNames.length] })
            .where(eq(matches.id, m.id))
        )
      );
    }
  }

  revalidatePath(`/events/${eventId}/match`);
  revalidatePath(`/events/${eventId}`);
}

export async function saveGroups(eventId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [event] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.hostId, user.id)));
  if (!event) return;

  const nameA = (formData.get("groupA") as string)?.trim();
  const nameB = (formData.get("groupB") as string)?.trim();
  if (!nameA || !nameB) return;

  const existingGroups = await db
    .select()
    .from(groups)
    .where(eq(groups.eventId, eventId));

  if (existingGroups.length >= 2) {
    await db.update(groups).set({ name: nameA }).where(eq(groups.id, existingGroups[0].id));
    await db.update(groups).set({ name: nameB }).where(eq(groups.id, existingGroups[1].id));
  } else {
    await db.delete(groups).where(eq(groups.eventId, eventId));
    const [gA] = await db.insert(groups).values({ eventId, name: nameA }).returning();
    const [gB] = await db.insert(groups).values({ eventId, name: nameB, matchWithId: gA.id }).returning();
    await db.update(groups).set({ matchWithId: gB.id }).where(eq(groups.id, gA.id));
  }

  revalidatePath(`/events/${eventId}`);
}

const SEED_NAMES = [
  ["Alice", "Morgan"], ["Bob", "Chen"], ["Carol", "Rivera"], ["David", "Kim"],
  ["Eva", "Patel"], ["Frank", "Osei"], ["Grace", "Tanaka"], ["Henry", "Müller"],
  ["Iris", "Santos"], ["Jack", "Novak"], ["Karen", "Ali"], ["Leo", "Petrov"],
  ["Maya", "Lindqvist"], ["Noah", "Okonkwo"], ["Olivia", "Reyes"], ["Paul", "Zhang"],
  ["Quinn", "Ferreira"], ["Rosa", "Björk"], ["Sam", "Nakamura"], ["Tara", "Wallace"],
];

export async function deliverResults(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [event] = await db
    .select({ id: events.id, status: events.status })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.hostId, user.id)));

  if (!event || event.status !== "matched") return;

  await db
    .update(events)
    .set({ status: "delivered", updatedAt: new Date() })
    .where(eq(events.id, eventId));

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
}

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
    .set({ phone: sql`NULL` })
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
    .select({ id: events.id, matchingMode: events.matchingMode })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.hostId, user.id)));
  if (!event) redirect("/dashboard");

  const eventQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.eventId, eventId));

  // For two_sided events, assign attendees alternately to the two groups
  const eventGroups = event.matchingMode === "two_sided"
    ? await db.select().from(groups).where(eq(groups.eventId, eventId))
    : [];

  const ts = Date.now().toString().slice(-6);
  const newAttendees = Array.from({ length: count }, (_, i) => {
    const [first, last] = SEED_NAMES[i % SEED_NAMES.length];
    const groupId = eventGroups.length >= 2
      ? eventGroups[i % 2].id
      : undefined;
    return {
      eventId,
      name: `${first} ${last}`,
      phone: `+1555${ts}${String(i).padStart(2, "0")}`,
      token: randomUUID(),
      ...(groupId ? { groupId } : {}),
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
