"use client";

import { useState, useTransition } from "react";
import { addQuestion, deleteQuestion, updateQuestionWeight, reorderQuestions } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QuestionType = "single_choice" | "multiple_choice" | "scale";

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: string[] | null;
  weight: number;
  scaleMin: number | null;
  scaleMax: number | null;
  order: number;
}

interface Props {
  eventId: string;
  initialQuestions: Question[];
  error?: string;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  scale: "Scale",
};

export function QuestionBuilder({ eventId, initialQuestions, error }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [type, setType] = useState<QuestionType>("single_choice");
  const [weight, setWeight] = useState(5);
  const [isPending, startTransition] = useTransition();

  const needsOptions = type === "single_choice" || type === "multiple_choice";

  function handleAdd(formData: FormData) {
    formData.set("weight", String(weight));
    formData.set("order", String(questions.length));
    startTransition(async () => {
      await addQuestion(eventId, formData);
    });
  }

  function handleDelete(questionId: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    startTransition(async () => {
      await deleteQuestion(eventId, questionId);
    });
  }

  function handleWeightChange(questionId: string, newWeight: number) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, weight: newWeight } : q))
    );
    startTransition(async () => {
      await updateQuestionWeight(eventId, questionId, newWeight);
    });
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const next = [...questions];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setQuestions(next);
    startTransition(async () => {
      await reorderQuestions(eventId, next.map((q) => q.id));
    });
  }

  function handleMoveDown(index: number) {
    if (index === questions.length - 1) return;
    const next = [...questions];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setQuestions(next);
    startTransition(async () => {
      await reorderQuestions(eventId, next.map((q) => q.id));
    });
  }

  return (
    <div className="space-y-6">
      {/* Existing questions */}
      {questions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {questions.length} / 10 questions
            </h2>
          </div>

          {questions.map((q, index) => (
            <Card key={q.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-medium">
                        Q{index + 1}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {TYPE_LABELS[q.type]}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Weight {q.weight}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-medium leading-snug">
                      {q.text}
                    </CardTitle>
                    {q.options && q.options.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {q.options.join(" · ")}
                      </p>
                    )}
                    {q.type === "scale" && (
                      <p className="text-xs text-muted-foreground">
                        Scale {q.scaleMin ?? 1}–{q.scaleMax ?? 10}
                      </p>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0 || isPending}
                      title="Move up"
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === questions.length - 1 || isPending}
                      title="Move down"
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(q.id)}
                      disabled={isPending}
                      title="Delete"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Weight slider */}
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Matching weight
                    </Label>
                    <span className="text-xs font-medium">{q.weight} / 10</span>
                  </div>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[q.weight]}
                    onValueChange={([val]) => handleWeightChange(q.id, val)}
                    disabled={isPending}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Low influence</span>
                    <span>High influence</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add question form */}
      {questions.length < 10 && (
        <>
          {questions.length > 0 && <Separator />}

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">
              {questions.length === 0 ? "Add your first question" : "Add another question"}
            </h2>
            {questions.length === 0 && (
              <p className="text-xs text-muted-foreground">
                You need at least 3 questions to run matching.
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={handleAdd} className="space-y-4">
            {/* Question text */}
            <div className="space-y-2">
              <Label htmlFor="text">Question</Label>
              <Input
                id="text"
                name="text"
                placeholder="What industry are you in?"
                required
              />
            </div>

            {/* Type selector */}
            <div className="space-y-2">
              <Label htmlFor="type">Answer type</Label>
              <Select
                name="type"
                value={type}
                onValueChange={(v) => setType(v as QuestionType)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_choice">
                    Single choice — pick one option
                  </SelectItem>
                  <SelectItem value="multiple_choice">
                    Multiple choice — pick all that apply
                  </SelectItem>
                  <SelectItem value="scale">
                    Scale — rate on a numeric range
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Options (choice types) */}
            {needsOptions && (
              <div className="space-y-2">
                <Label htmlFor="options">
                  Options{" "}
                  <span className="text-muted-foreground font-normal">
                    (one per line, min 2)
                  </span>
                </Label>
                <Textarea
                  id="options"
                  name="options"
                  placeholder={"Investor\nFounder\nOperator\nAdvisor"}
                  rows={4}
                  required
                />
              </div>
            )}

            {/* Scale range */}
            {type === "scale" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scaleMin">Min value</Label>
                  <Input
                    id="scaleMin"
                    name="scaleMin"
                    type="number"
                    defaultValue={1}
                    min={0}
                    max={9}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scaleMax">Max value</Label>
                  <Input
                    id="scaleMax"
                    name="scaleMax"
                    type="number"
                    defaultValue={10}
                    min={1}
                    max={100}
                  />
                </div>
              </div>
            )}

            {/* Weight */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Matching weight</Label>
                <span className="text-sm font-medium">{weight} / 10</span>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[weight]}
                onValueChange={([val]) => setWeight(val)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low influence on matching</span>
                <span>High influence on matching</span>
              </div>
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Saving…" : "Add question"}
            </Button>
          </form>
        </>
      )}

      {questions.length >= 10 && (
        <p className="text-sm text-center text-muted-foreground">
          Maximum of 10 questions reached.
        </p>
      )}

      {/* Footer hint */}
      {questions.length >= 3 && (
        <p className="text-sm text-center text-muted-foreground">
          ✓ You have enough questions.{" "}
          <a
            href={`/events/${eventId}`}
            className="underline underline-offset-2 text-foreground"
          >
            Go back and open the event.
          </a>
        </p>
      )}
    </div>
  );
}
