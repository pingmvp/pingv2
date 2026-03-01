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

interface QuestionTemplate {
  text: string;
  type: QuestionType;
  options?: string;
  scaleMin?: number;
  scaleMax?: number;
  weight: number;
}

const QUESTION_TEMPLATES: { category: string; templates: QuestionTemplate[] }[] = [
  {
    category: "Role & Background",
    templates: [
      {
        text: "What best describes your role?",
        type: "single_choice",
        options: "Founder\nInvestor\nOperator\nProduct Manager\nEngineer\nDesigner\nAdvisor",
        weight: 8,
      },
      {
        text: "What industry are you in?",
        type: "single_choice",
        options: "Tech\nFinance\nHealthcare\nClimate\nConsumer\nB2B SaaS\nOther",
        weight: 7,
      },
      {
        text: "What stage is your company?",
        type: "single_choice",
        options: "Idea stage\nPre-seed\nSeed\nSeries A\nSeries B+\nProfitable / Bootstrapped",
        weight: 6,
      },
    ],
  },
  {
    category: "Goals & Intent",
    templates: [
      {
        text: "What are you primarily looking for at this event?",
        type: "single_choice",
        options: "Fundraising\nHiring\nFinding customers\nFinding a co-founder\nLearning\nPartnerships",
        weight: 9,
      },
      {
        text: "Are you currently raising capital?",
        type: "single_choice",
        options: "Yes — actively fundraising\nNo — not raising\nNo — but open to conversations",
        weight: 8,
      },
      {
        text: "What's your biggest priority right now?",
        type: "multiple_choice",
        options: "Revenue growth\nBuilding the team\nProduct development\nFundraising\nExpanding to new markets",
        weight: 7,
      },
    ],
  },
  {
    category: "Experience & Expertise",
    templates: [
      {
        text: "How many years of relevant experience do you have?",
        type: "scale",
        scaleMin: 0,
        scaleMax: 15,
        weight: 5,
      },
      {
        text: "How technical are you?",
        type: "scale",
        scaleMin: 1,
        scaleMax: 10,
        weight: 5,
      },
      {
        text: "What areas are you strongest in?",
        type: "multiple_choice",
        options: "Sales & GTM\nProduct & Design\nEngineering\nFinance & Operations\nMarketing\nPeople & Culture",
        weight: 6,
      },
    ],
  },
  {
    category: "Preferences & Style",
    templates: [
      {
        text: "How do you prefer to collaborate?",
        type: "single_choice",
        options: "Deep long-term partnerships\nQuick advice / intros\nRegular check-ins\nOne-off projects",
        weight: 5,
      },
      {
        text: "Where are you based?",
        type: "single_choice",
        options: "San Francisco Bay Area\nNew York\nLos Angeles\nLondon\nRemote / other",
        weight: 4,
      },
    ],
  },
];

export function QuestionBuilder({ eventId, initialQuestions, error }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [type, setType] = useState<QuestionType>("single_choice");
  const [text, setText] = useState("");
  const [options, setOptions] = useState("");
  const [weight, setWeight] = useState(5);
  const [isPending, startTransition] = useTransition();
  const [showTemplates, setShowTemplates] = useState(questions.length === 0);

  const needsOptions = type === "single_choice" || type === "multiple_choice";

  function applyTemplate(template: QuestionTemplate) {
    setText(template.text);
    setType(template.type);
    setOptions(template.options ?? "");
    setWeight(template.weight);
    setShowTemplates(false);
    // Scroll to form
    document.getElementById("add-question-form")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleAdd(formData: FormData) {
    formData.set("weight", String(weight));
    formData.set("order", String(questions.length));
    startTransition(async () => {
      const created = await addQuestion(eventId, formData);
      if (created) {
        setQuestions((prev) => [...prev, created]);
      }
      setText("");
      setOptions("");
      setWeight(5);
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
      {/* Progress indicator */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${Math.min((questions.length / 3) * 100, 100)}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {questions.length} / 10
          {questions.length < 3 && ` · need ${3 - questions.length} more`}
          {questions.length >= 3 && " · ready to open"}
        </span>
      </div>

      {/* Existing questions */}
      {questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((q, index) => (
            <Card key={q.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-medium">Q{index + 1}</span>
                      <Badge variant="outline" className="text-xs">{TYPE_LABELS[q.type]}</Badge>
                      <Badge variant="secondary" className="text-xs">Weight {q.weight}</Badge>
                    </div>
                    <CardTitle className="text-base font-medium leading-snug">{q.text}</CardTitle>
                    {q.options && q.options.length > 0 && (
                      <p className="text-xs text-muted-foreground">{q.options.join(" · ")}</p>
                    )}
                    {q.type === "scale" && (
                      <p className="text-xs text-muted-foreground">
                        Scale {q.scaleMin ?? 1}–{q.scaleMax ?? 10}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0 || isPending}
                      title="Move up"
                    >↑</Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === questions.length - 1 || isPending}
                      title="Move down"
                    >↓</Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(q.id)}
                      disabled={isPending}
                      title="Delete"
                    >×</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Matching weight</Label>
                    <span className="text-xs font-medium">{q.weight} / 10</span>
                  </div>
                  <Slider
                    min={1} max={10} step={1}
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

      {questions.length >= 10 && (
        <p className="text-sm text-center text-muted-foreground">Maximum of 10 questions reached.</p>
      )}

      {/* Add question section */}
      {questions.length < 10 && (
        <>
          {questions.length > 0 && <Separator />}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {questions.length === 0 ? "Add your first question" : "Add another question"}
              </h2>
              <button
                type="button"
                onClick={() => setShowTemplates((v) => !v)}
                className="text-xs text-primary underline underline-offset-2"
              >
                {showTemplates ? "Hide templates" : "Browse templates"}
              </button>
            </div>

            {/* Question templates */}
            {showTemplates && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Click a template to pre-fill the form below. You can edit it before adding.
                </p>
                {QUESTION_TEMPLATES.map((group) => (
                  <div key={group.category} className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {group.category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.templates.map((t) => (
                        <button
                          key={t.text}
                          type="button"
                          onClick={() => applyTemplate(t)}
                          className="text-left text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-muted transition-colors"
                        >
                          {t.text}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {decodeURIComponent(error)}
              </div>
            )}

            <form id="add-question-form" action={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text">Question</Label>
                <Input
                  id="text"
                  name="text"
                  placeholder="What industry are you in?"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                />
              </div>

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
                    <SelectItem value="single_choice">Single choice — pick one option</SelectItem>
                    <SelectItem value="multiple_choice">Multiple choice — pick all that apply</SelectItem>
                    <SelectItem value="scale">Scale — rate on a numeric range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {needsOptions && (
                <div className="space-y-2">
                  <Label htmlFor="options">
                    Options{" "}
                    <span className="text-muted-foreground font-normal">(one per line, min 2)</span>
                  </Label>
                  <Textarea
                    id="options"
                    name="options"
                    placeholder={"Investor\nFounder\nOperator\nAdvisor"}
                    rows={4}
                    value={options}
                    onChange={(e) => setOptions(e.target.value)}
                    required
                  />
                </div>
              )}

              {type === "scale" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scaleMin">Min value</Label>
                    <Input id="scaleMin" name="scaleMin" type="number" defaultValue={1} min={0} max={9} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scaleMax">Max value</Label>
                    <Input id="scaleMax" name="scaleMax" type="number" defaultValue={10} min={1} max={100} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Matching weight</Label>
                  <span className="text-sm font-medium">{weight} / 10</span>
                </div>
                <Slider
                  min={1} max={10} step={1}
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
                {isPending ? "Saving…" : "+ Add question"}
              </Button>
            </form>
          </div>
        </>
      )}

      {questions.length >= 3 && (
        <p className="text-sm text-center text-muted-foreground">
          ✓ You have enough questions.{" "}
          <a href={`/events/${eventId}`} className="underline underline-offset-2 text-foreground">
            Go back and open the event.
          </a>
        </p>
      )}
    </div>
  );
}
