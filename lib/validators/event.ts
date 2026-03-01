import { z } from "zod";

export const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(100),
  description: z.string().max(500).optional(),
  date: z.coerce.date().optional(),
  location: z.string().max(200).optional(),
  matchCount: z.number().int().min(1).max(10).default(3),
  matchingMode: z.enum(["general", "two_sided"]).default("general"),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: z
    .enum(["draft", "open", "closed", "matched", "delivered"])
    .optional(),
  deliveryTime: z.coerce.date().optional(),
});

export const createQuestionSchema = z.object({
  text: z.string().min(1, "Question text is required").max(300),
  type: z.enum(["single_choice", "multiple_choice", "scale"]),
  options: z.array(z.string()).min(2).max(10).optional(),
  scaleMin: z.number().int().default(1),
  scaleMax: z.number().int().default(10),
  weight: z.number().int().min(1).max(10).default(5),
  order: z.number().int().default(0),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
