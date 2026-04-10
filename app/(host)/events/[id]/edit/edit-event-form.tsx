"use client";

import { useTransition } from "react";
import Link from "next/link";
import { updateEvent } from "../../actions";
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

interface Event {
  id: string;
  name: string;
  description: string | null;
  date: Date | null;
  location: string | null;
  matchCount: number;
  matchingMode: string;
  status: string;
}

interface Props {
  event: Event;
  error?: string;
}

function toDatetimeLocal(date: Date | null): string {
  if (!date) return "";
  // Format as YYYY-MM-DDTHH:MM for datetime-local input
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditEventForm({ event, error }: Props) {
  const [isPending, startTransition] = useTransition();
  const isDraft = event.status === "draft";

  function handleSubmit(formData: FormData) {
    startTransition(() => updateEvent(event.id, formData));
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {decodeURIComponent(error)}
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Event details</CardTitle>
          <CardDescription>Attendees see this on their questionnaire page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Event name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={event.name}
              placeholder="Founder Mixer · March 2026"
              required
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
              defaultValue={event.description ?? ""}
              placeholder="A short intro attendees will read before filling out the questionnaire…"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date & time</Label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                defaultValue={toDatetimeLocal(event.date)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                defaultValue={event.location ?? ""}
                placeholder="San Francisco, CA"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isDraft && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Matching settings</CardTitle>
            <CardDescription>Configure how attendees are paired together.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matchingMode">Matching mode</Label>
              <Select name="matchingMode" defaultValue={event.matchingMode}>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="matchCount">Matches per attendee</Label>
              <Select name="matchCount" defaultValue={String(event.matchCount)}>
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
              <p className="text-xs text-muted-foreground mt-1">How many people each attendee will be matched with</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" asChild>
          <Link href={`/events/${event.id}`}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
