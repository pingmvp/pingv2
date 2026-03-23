import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "open",
  "closed",
  "matched",
  "delivered",
  "archived",
]);

export const matchingModeEnum = pgEnum("matching_mode", [
  "general",
  "two_sided",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "single_choice",
  "multiple_choice",
  "scale",
]);

export const feedbackRatingEnum = pgEnum("feedback_rating", [
  "positive",
  "negative",
]);

// ── Events ────────────────────────────────────────────────────────────────────

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  hostId: uuid("host_id").notNull(), // references Supabase auth.users
  name: text("name").notNull(),
  description: text("description"),
  date: timestamp("date", { withTimezone: true }),
  location: text("location"),
  matchCount: integer("match_count").notNull().default(3),
  matchingMode: matchingModeEnum("matching_mode").notNull().default("general"),
  zones: jsonb("zones").$type<string[]>(), // optional meeting zone names
  status: eventStatusEnum("status").notNull().default("draft"),
  deliveryTime: timestamp("delivery_time", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Groups (for two-sided matching) ──────────────────────────────────────────

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  matchWithId: uuid("match_with_id"), // self-referencing, set after both groups created
});

// ── Questions ─────────────────────────────────────────────────────────────────

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  type: questionTypeEnum("type").notNull(),
  options: jsonb("options").$type<string[]>(), // for single/multiple choice
  scaleMin: integer("scale_min").default(1),
  scaleMax: integer("scale_max").default(10),
  weight: integer("weight").notNull().default(5), // 1-10
  order: integer("order").notNull().default(0),
});

// ── Attendees ─────────────────────────────────────────────────────────────────

export const attendees = pgTable("attendees", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").references(() => groups.id),
  name: text("name").notNull(),
  email: text("email"), // nullable — cleared on archive to remove PII
  token: text("token").notNull().unique(), // used in /e/[token] and /f/[token]
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Responses ─────────────────────────────────────────────────────────────────

export const responses = pgTable("responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  attendeeId: uuid("attendee_id")
    .notNull()
    .references(() => attendees.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  // Stores: string for single_choice, string[] for multiple_choice, number for scale
  value: jsonb("value").notNull(),
});

// ── Matches ───────────────────────────────────────────────────────────────────

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  attendeeAId: uuid("attendee_a_id")
    .notNull()
    .references(() => attendees.id, { onDelete: "cascade" }),
  attendeeBId: uuid("attendee_b_id")
    .notNull()
    .references(() => attendees.id, { onDelete: "cascade" }),
  score: real("score").notNull(), // 0.0 - 1.0 compatibility score
  rankForA: integer("rank_for_a").notNull(),
  rankForB: integer("rank_for_b").notNull(),
  zone: text("zone"), // optional meeting zone assigned to this pair
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Feedback ──────────────────────────────────────────────────────────────────

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  attendeeId: uuid("attendee_id")
    .notNull()
    .references(() => attendees.id, { onDelete: "cascade" }),
  rating: feedbackRatingEnum("rating").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const eventsRelations = relations(events, ({ many }) => ({
  questions: many(questions),
  attendees: many(attendees),
  matches: many(matches),
  groups: many(groups),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  event: one(events, { fields: [groups.eventId], references: [events.id] }),
  attendees: many(attendees),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  event: one(events, { fields: [questions.eventId], references: [events.id] }),
  responses: many(responses),
}));

export const attendeesRelations = relations(attendees, ({ one, many }) => ({
  event: one(events, { fields: [attendees.eventId], references: [events.id] }),
  group: one(groups, { fields: [attendees.groupId], references: [groups.id] }),
  responses: many(responses),
}));

export const responsesRelations = relations(responses, ({ one }) => ({
  attendee: one(attendees, {
    fields: [responses.attendeeId],
    references: [attendees.id],
  }),
  question: one(questions, {
    fields: [responses.questionId],
    references: [questions.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  event: one(events, { fields: [matches.eventId], references: [events.id] }),
  attendeeA: one(attendees, {
    fields: [matches.attendeeAId],
    references: [attendees.id],
  }),
  attendeeB: one(attendees, {
    fields: [matches.attendeeBId],
    references: [attendees.id],
  }),
  feedback: many(feedback),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  match: one(matches, { fields: [feedback.matchId], references: [matches.id] }),
  attendee: one(attendees, {
    fields: [feedback.attendeeId],
    references: [attendees.id],
  }),
}));
