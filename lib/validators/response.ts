import { z } from "zod";

const answerSchema = z.union([
  z.string(),          // single_choice
  z.array(z.string()), // multiple_choice
  z.number(),          // scale
]);

export const submitResponseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z
    .string()
    .min(1, "Email is required")
    .max(200)
    .email("Invalid email address"),
  groupId: z.string().uuid().optional(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      value: answerSchema,
    })
  ).min(1),
});

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
