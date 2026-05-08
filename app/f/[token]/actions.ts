"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { surveyResponses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const surveySchema = z
  .object({
    easeOfNavigation: z.number().int().min(1).max(5),
    matchAccess: z.enum(["yes", "no", "other"]),
    matchAccessOther: z.string().optional(),
    matchAlignment: z.number().int().min(1).max(5),
  })
  .refine(
    (d) =>
      d.matchAccess !== "other" ||
      (d.matchAccessOther?.trim() ?? "").length > 0,
    { message: "Please describe your experience", path: ["matchAccessOther"] }
  );

export async function submitSurvey(
  attendeeId: string,
  eventId: string,
  token: string,
  data: {
    easeOfNavigation: number;
    matchAccess: "yes" | "no" | "other";
    matchAccessOther?: string;
    matchAlignment: number;
  }
) {
  const result = surveySchema.safeParse(data);
  if (!result.success) return;

  // Guard: already submitted (DB unique constraint is the final guard, this is belt-and-suspenders)
  const [existing] = await db
    .select({ id: surveyResponses.id })
    .from(surveyResponses)
    .where(eq(surveyResponses.attendeeId, attendeeId));

  if (existing) {
    redirect(`/f/${token}/done`);
  }

  const { easeOfNavigation, matchAccess, matchAccessOther, matchAlignment } =
    result.data;

  await db.insert(surveyResponses).values({
    attendeeId,
    eventId,
    easeOfNavigation,
    matchAccess,
    matchAccessOther:
      matchAccess === "other" ? (matchAccessOther ?? null) : null,
    matchAlignment,
  });

  redirect(`/f/${token}/done`);
}
