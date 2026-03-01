"use client";

import { useTransition, useState } from "react";
import { submitQuestionnaire } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

type QuestionType = "single_choice" | "multiple_choice" | "scale";

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: string[] | null;
  scaleMin: number | null;
  scaleMax: number | null;
  order: number;
}

interface Props {
  eventId: string;
  questions: Question[];
  error?: string;
}

export function QuestionnaireForm({ eventId, questions, error }: Props) {
  const [isPending, startTransition] = useTransition();

  // Track scale values for controlled sliders
  const [scaleValues, setScaleValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      questions
        .filter((q) => q.type === "scale")
        .map((q) => [q.id, Math.round(((q.scaleMin ?? 1) + (q.scaleMax ?? 10)) / 2)])
    )
  );

  function handleSubmit(formData: FormData) {
    // Inject scale values manually since sliders use state
    for (const [qId, val] of Object.entries(scaleValues)) {
      formData.set(`q_${qId}`, String(val));
    }
    startTransition(() => submitQuestionnaire(eventId, formData));
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {/* Contact info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Your name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="Alex Chen"
            required
            autoComplete="name"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            required
            autoComplete="tel"
          />
          <p className="text-xs text-muted-foreground">
            We&apos;ll text your matches to this number before the event.
          </p>
        </div>
      </div>

      {questions.length > 0 && <Separator />}

      {/* Questions */}
      {questions.map((q, index) => (
        <div key={q.id} className="space-y-3">
          <Label className="text-base font-medium leading-snug">
            <span className="text-muted-foreground text-sm font-normal mr-2">
              {index + 1}.
            </span>
            {q.text}
          </Label>

          {/* Single choice */}
          {q.type === "single_choice" && q.options && (
            <RadioGroup name={`q_${q.id}`} required>
              {q.options.map((opt) => (
                <div key={opt} className="flex items-center gap-3">
                  <RadioGroupItem value={opt} id={`${q.id}_${opt}`} />
                  <Label
                    htmlFor={`${q.id}_${opt}`}
                    className="font-normal cursor-pointer"
                  >
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Multiple choice */}
          {q.type === "multiple_choice" && q.options && (
            <div className="space-y-2">
              {q.options.map((opt) => (
                <div key={opt} className="flex items-center gap-3">
                  <Checkbox
                    id={`${q.id}_${opt}`}
                    name={`q_${q.id}`}
                    value={opt}
                  />
                  <Label
                    htmlFor={`${q.id}_${opt}`}
                    className="font-normal cursor-pointer"
                  >
                    {opt}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {/* Scale */}
          {q.type === "scale" && (
            <div className="space-y-3 pt-1">
              <Slider
                min={q.scaleMin ?? 1}
                max={q.scaleMax ?? 10}
                step={1}
                value={[scaleValues[q.id] ?? Math.round(((q.scaleMin ?? 1) + (q.scaleMax ?? 10)) / 2)]}
                onValueChange={([val]) =>
                  setScaleValues((prev) => ({ ...prev, [q.id]: val }))
                }
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{q.scaleMin ?? 1}</span>
                <span className="font-medium text-foreground">
                  {scaleValues[q.id]}
                </span>
                <span>{q.scaleMax ?? 10}</span>
              </div>
            </div>
          )}
        </div>
      ))}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {decodeURIComponent(error)}
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}
