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
import { Users2, Globe, Building2, Zap } from "lucide-react";

interface EventTemplate {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  matchingMode: "general" | "two_sided";
  matchCount: string;
  eventDescription: string;
  gradient: string;
  iconWrap: string;
  ring: string;
}

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: "founder-investor",
    icon: <Users2 className="w-5 h-5" />,
    label: "Founder × Investor",
    description: "Two-sided matching between founders and investors",
    matchingMode: "two_sided",
    matchCount: "3",
    eventDescription:
      "A curated mixer for founders and investors. Fill out this short questionnaire and we'll match you with the most relevant people to meet.",
    gradient: "from-violet-50 to-purple-50/50 border-violet-200 hover:border-violet-300",
    iconWrap: "bg-violet-100 text-violet-600",
    ring: "ring-violet-400 border-violet-300 bg-violet-50/80",
  },
  {
    id: "networking",
    icon: <Globe className="w-5 h-5" />,
    label: "General Networking",
    description: "Match attendees by shared interests and background",
    matchingMode: "general",
    matchCount: "3",
    eventDescription:
      "Connect with the right people. Fill out a quick questionnaire and we'll match you based on your background and goals.",
    gradient: "from-sky-50 to-blue-50/50 border-sky-200 hover:border-sky-300",
    iconWrap: "bg-sky-100 text-sky-600",
    ring: "ring-sky-400 border-sky-300 bg-sky-50/80",
  },
  {
    id: "conference",
    icon: <Building2 className="w-5 h-5" />,
    label: "Conference Side Event",
    description: "High-volume matching for conference attendees",
    matchingMode: "general",
    matchCount: "5",
    eventDescription:
      "Make the most of your time at the conference. Answer a few questions and we'll introduce you to the people you should meet.",
    gradient: "from-amber-50 to-orange-50/50 border-amber-200 hover:border-amber-300",
    iconWrap: "bg-amber-100 text-amber-600",
    ring: "ring-amber-400 border-amber-300 bg-amber-50/80",
  },
  {
    id: "speed",
    icon: <Zap className="w-5 h-5" />,
    label: "Speed Networking",
    description: "Maximize meetings — more matches, wider net",
    matchingMode: "general",
    matchCount: "5",
    eventDescription:
      "Speed networking done right. Tell us about yourself and we'll send you your top matches before the session starts.",
    gradient: "from-emerald-50 to-green-50/50 border-emerald-200 hover:border-emerald-300",
    iconWrap: "bg-emerald-100 text-emerald-600",
    ring: "ring-emerald-400 border-emerald-300 bg-emerald-50/80",
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

  function applyTemplate(t: EventTemplate) {
    setSelectedTemplate(t.id);
    setDescription(t.eventDescription);
    setMatchingMode(t.matchingMode);
    setMatchCount(t.matchCount);
  }

  function handleSubmit(formData: FormData) {
    formData.set("description", description);
    formData.set("matchingMode", matchingMode);
    formData.set("matchCount", matchCount);
    startTransition(() => createEvent(formData));
  }

  return (
    <div className="space-y-8">
      {/* Template picker */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold">Start from a template</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pick one to pre-fill the settings, or configure manually below.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {EVENT_TEMPLATES.map((t) => {
            const isSelected = selectedTemplate === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t)}
                className={[
                  "text-left rounded-xl border bg-gradient-to-br p-4 transition-all duration-150 space-y-3",
                  isSelected
                    ? `ring-2 ring-offset-1 ${t.ring}`
                    : `${t.gradient} hover:shadow-sm`,
                ].join(" ")}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.iconWrap}`}>
                  {t.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {t.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={handleSubmit} className="space-y-5">
        {/* Event details */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Event details</CardTitle>
            <CardDescription>
              Attendees see this on their questionnaire page.
            </CardDescription>
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
                Description
                <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                  shown to attendees
                </span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short intro attendees will read before filling out the questionnaire…"
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
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Matching settings</CardTitle>
            <CardDescription>Configure how attendees are paired together.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matchingMode">Matching mode</Label>
              <Select name="matchingMode" value={matchingMode} onValueChange={setMatchingMode}>
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
                  Attendees will be assigned to a group when they fill out the questionnaire.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="matchCount">Matches per attendee</Label>
              <Select name="matchCount" value={matchCount} onValueChange={setMatchCount}>
                <SelectTrigger id="matchCount">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? "match" : "matches"} per person
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Delivered via SMS at event start. 3–5 works well for most events.
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
