"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { events, attendees, responses, questions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod";

const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address");

export async function submitQuestionnaire(eventId: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();

  if (!name) redirect(`/e/${eventId}?error=Name+is+required`);

  const emailResult = emailSchema.safeParse(email);
  if (!emailResult.success) {
    redirect(`/e/${eventId}?error=${encodeURIComponent(emailResult.error.issues[0].message)}`);
  }

  // Verify event is open
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.status, "open")));

  if (!event) redirect(`/e/${eventId}?error=This+event+is+not+accepting+responses`);

  // Duplicate email check
  const [existing] = await db
    .select()
    .from(attendees)
    .where(and(eq(attendees.eventId, eventId), eq(attendees.email, email)));

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
    .values({ eventId, name, email, token, ...(groupId ? { groupId } : {}) })
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
