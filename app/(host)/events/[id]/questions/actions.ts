"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { questions, events } from "@/lib/db/schema";
import { createQuestionSchema } from "@/lib/validators/event";
import { and, eq } from "drizzle-orm";

async function getVerifiedEvent(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.hostId, user.id)));

  if (!event) redirect("/dashboard");
  return { event, userId: user.id };
}

export async function addQuestion(eventId: string, formData: FormData) {
  await getVerifiedEvent(eventId);

  const type = formData.get("type") as string;
  const optionsRaw = formData.get("options") as string;
  const options =
    type === "single_choice" || type === "multiple_choice"
      ? optionsRaw
          .split("\n")
          .map((o) => o.trim())
          .filter(Boolean)
      : undefined;

  const raw = {
    text: formData.get("text"),
    type,
    options,
    scaleMin: type === "scale" ? Number(formData.get("scaleMin") ?? 1) : 1,
    scaleMax: type === "scale" ? Number(formData.get("scaleMax") ?? 10) : 10,
    weight: Number(formData.get("weight") ?? 5),
    order: Number(formData.get("order") ?? 0),
  };

  const parsed = createQuestionSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid question";
    redirect(`/events/${eventId}/questions?error=${encodeURIComponent(msg)}`);
  }

  await db.insert(questions).values({ ...parsed.data, eventId });
  revalidatePath(`/events/${eventId}/questions`);
  revalidatePath(`/events/${eventId}`);
}

export async function deleteQuestion(eventId: string, questionId: string) {
  await getVerifiedEvent(eventId);

  await db
    .delete(questions)
    .where(and(eq(questions.id, questionId), eq(questions.eventId, eventId)));

  revalidatePath(`/events/${eventId}/questions`);
  revalidatePath(`/events/${eventId}`);
}

export async function updateQuestionWeight(
  eventId: string,
  questionId: string,
  weight: number
) {
  await getVerifiedEvent(eventId);

  await db
    .update(questions)
    .set({ weight })
    .where(and(eq(questions.id, questionId), eq(questions.eventId, eventId)));

  revalidatePath(`/events/${eventId}/questions`);
}

export async function reorderQuestions(
  eventId: string,
  orderedIds: string[]
) {
  await getVerifiedEvent(eventId);

  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(questions)
        .set({ order: index })
        .where(and(eq(questions.id, id), eq(questions.eventId, eventId)))
    )
  );

  revalidatePath(`/events/${eventId}/questions`);
}
