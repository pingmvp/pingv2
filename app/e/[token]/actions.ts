"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { events, attendees, responses, questions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod";

const phoneSchema = z
  .string()
  .min(7, "Phone number is required")
  .regex(/^\+?[\d\s\-().]+$/, "Invalid phone number");

export async function submitQuestionnaire(eventId: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!name) redirect(`/e/${eventId}?error=Name+is+required`);

  const phoneResult = phoneSchema.safeParse(phone);
  if (!phoneResult.success) {
    redirect(`/e/${eventId}?error=${encodeURIComponent(phoneResult.error.issues[0].message)}`);
  }

  // Verify event is open
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.status, "open")));

  if (!event) redirect(`/e/${eventId}?error=This+event+is+not+accepting+responses`);

  // Duplicate phone check
  const [existing] = await db
    .select()
    .from(attendees)
    .where(and(eq(attendees.eventId, eventId), eq(attendees.phone, phone)));

  if (existing) redirect(`/e/${eventId}?error=You+have+already+submitted+a+response`);

  // Load questions to parse answers correctly
  const eventQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.eventId, eventId));

  // Parse answers from formData
  const answers = eventQuestions.map((q) => {
    let value: unknown;
    if (q.type === "multiple_choice") {
      value = formData.getAll(`q_${q.id}`) as string[];
    } else if (q.type === "scale") {
      value = Number(formData.get(`q_${q.id}`));
    } else {
      value = formData.get(`q_${q.id}`) as string;
    }
    return { questionId: q.id, value };
  });

  // Insert attendee + all responses
  const token = randomUUID();
  const groupId = (formData.get("groupId") as string | null) || null;

  const [attendee] = await db
    .insert(attendees)
    .values({ eventId, name, phone, token, ...(groupId ? { groupId } : {}) })
    .returning();

  if (answers.length > 0) {
    await db.insert(responses).values(
      answers.map(({ questionId, value }) => ({
        attendeeId: attendee.id,
        questionId,
        value,
      }))
    );
  }

  redirect(`/e/${token}/done`);
}
