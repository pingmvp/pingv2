"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createEvent } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EventTemplate {
  id: string;
  icon: string;
  label: string;
  description: string;
  matchingMode: "general" | "two_sided";
  matchCount: string;
  eventDescription: string;
}

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: "founder-investor",
    icon: "🤝",
    label: "Founder × Investor Mixer",
    description: "Two-sided matching between founders and investors",
    matchingMode: "two_sided",
    matchCount: "3",
    eventDescription:
      "A curated mixer for founders and investors. Fill out this short questionnaire and we'll match you with the most relevant people to meet.",
  },
  {
    id: "networking",
    icon: "🌐",
    label: "General Networking",
    description: "Connect attendees based on shared interests and background",
    matchingMode: "general",
    matchCount: "3",
    eventDescription:
      "Connect with the right people at this event. Fill out a quick questionnaire and we'll match you based on your background and goals.",
  },
  {
    id: "conference",
    icon: "🎯",
    label: "Conference Side Event",
    description: "High-volume matching for conference attendees",
    matchingMode: "general",
    matchCount: "5",
    eventDescription:
      "Make the most of your time at the conference. Answer a few questions and we'll introduce you to the people you should meet.",
  },
  {
    id: "speed",
    icon: "⚡",
    label: "Speed Networking",
    description: "Maximize meetings — more matches, wider net",
    matchingMode: "general",
    matchCount: "5",
    eventDescription:
      "Speed networking done right. Tell us about yourself and we'll send you your top matches before the session starts.",
  },
];

interface Props {
  error?: string;
}

export function NewEventForm({ error }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [matchingMode, setMatchingMode] = useState("general");
  const [matchCount, setMatchCount] = useState("3");
  const [isPending, startTransition] = useTransition();

  function applyTemplate(template: EventTemplate) {
    setSelectedTemplate(template.id);
    setDescription(template.eventDescription);
    setMatchingMode(template.matchingMode);
    setMatchCount(template.matchCount);
  }

  function handleSubmit(formData: FormData) {
    formData.set("description", description);
    formData.set("matchingMode", matchingMode);
    formData.set("matchCount", matchCount);
    startTransition(() => createEvent(formData));
  }

  return (
    <div className="space-y-8">
      {/* Event templates */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Start from a template</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pick one to pre-fill the settings below, or set everything manually.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {EVENT_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t)}
              className={[
                "text-left rounded-lg border p-3 transition-colors hover:bg-muted/60 space-y-1",
                selectedTemplate === t.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{t.icon}</span>
                <span className="text-sm font-medium leading-tight">{t.label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event details</CardTitle>
            <CardDescription>This information appears on the attendee questionnaire page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Event name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Founder Mixer · March 2026"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  — shown to attendees on the questionnaire
                </span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description attendees will see…"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date & time</Label>
                <Input id="date" name="date" type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="San Francisco, CA" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matching settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Matching settings</CardTitle>
            <CardDescription>Configure how attendees are paired together.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matchingMode">Matching mode</Label>
              <Select
                name="matchingMode"
                value={matchingMode}
                onValueChange={setMatchingMode}
              >
                <SelectTrigger id="matchingMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">
                    General — everyone matches with everyone
                  </SelectItem>
                  <SelectItem value="two_sided">
                    Two-sided — match across two groups (e.g. investors ↔ founders)
                  </SelectItem>
                </SelectContent>
              </Select>
              {matchingMode === "two_sided" && (
                <p className="text-xs text-muted-foreground">
                  You'll assign attendees to groups (e.g. Investor / Founder) when they fill out the questionnaire.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="matchCount">Matches per attendee</Label>
              <Select
                name="matchCount"
                value={matchCount}
                onValueChange={setMatchCount}
              >
                <SelectTrigger id="matchCount">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? "match" : "matches"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How many people each attendee is introduced to via SMS.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create event →"}
          </Button>
        </div>
      </form>
    </div>
  );
}
