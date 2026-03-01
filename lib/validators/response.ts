import { z } from "zod";

const answerSchema = z.union([
  z.string(),          // single_choice
  z.array(z.string()), // multiple_choice
  z.number(),          // scale
]);

export const submitResponseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z
    .string()
    .min(7, "Phone number is required")
    .max(20)
    .regex(/^\+?[\d\s\-().]+$/, "Invalid phone number"),
  groupId: z.string().uuid().optional(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      value: answerSchema,
    })
  ).min(1),
});

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
