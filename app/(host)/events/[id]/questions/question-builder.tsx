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

interface Draft {
  text: string;
  type: QuestionType;
  options: string;
  weight: number;
  scaleMin: number;
  scaleMax: number;
}

export function QuestionBuilder({ eventId, initialQuestions, error }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [draft, setDraft] = useState<Draft | null>(
    initialQuestions.length === 0
      ? { text: "", type: "single_choice", options: "", weight: 5, scaleMin: 1, scaleMax: 10 }
      : null
  );
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showTemplates, setShowTemplates] = useState(initialQuestions.length === 0);

  const draftNeedsOptions = draft?.type === "single_choice" || draft?.type === "multiple_choice";

  function openDraft(init?: Partial<Draft>) {
    setDraft({
      text: "",
      type: "single_choice",
      options: "",
      weight: 5,
      scaleMin: 1,
      scaleMax: 10,
      ...init,
    });
    setDraftError(null);
  }

  function applyTemplate(template: QuestionTemplate) {
    setDraft({
      text: template.text,
      type: template.type,
      options: template.options ?? "",
      weight: template.weight,
      scaleMin: template.scaleMin ?? 1,
      scaleMax: template.scaleMax ?? 10,
    });
    setDraftError(null);
    setShowTemplates(false);
    setTimeout(() => document.getElementById("draft-text")?.focus(), 50);
  }

  function handleSaveDraft() {
    if (!draft) return;

    if (!draft.text.trim()) {
      setDraftError("Question text is required.");
      document.getElementById("draft-text")?.focus();
      return;
    }

    if (draftNeedsOptions) {
      const opts = draft.options.split("\n").map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) {
        setDraftError("Add at least 2 options (one per line).");
        document.getElementById("draft-options")?.focus();
        return;
      }
    }

    const fd = new FormData();
    fd.set("text", draft.text.trim());
    fd.set("type", draft.type);
    fd.set("options", draft.options);
    fd.set("weight", String(draft.weight));
    fd.set("order", String(questions.length));
    if (draft.type === "scale") {
      fd.set("scaleMin", String(draft.scaleMin));
      fd.set("scaleMax", String(draft.scaleMax));
    }

    startTransition(async () => {
      const created = await addQuestion(eventId, fd);
      if (created) {
        setQuestions((prev) => [...prev, created]);
        setDraft(null);
        setDraftError(null);
      }
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
                      aria-label="Move question up"
                    >↑</Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === questions.length - 1 || isPending}
                      title="Move down"
                      aria-label="Move question down"
                    >↓</Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(q.id)}
                      disabled={isPending}
                      title="Delete"
                      aria-label="Delete question"
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

      {/* Draft question card — appears in the list when opened */}
      {draft && questions.length < 10 && (
        <>
          {questions.length > 0 && <Separator />}

          <Card className="border-primary/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  {questions.length === 0 ? "Question 1" : `Question ${questions.length + 1}`}
                </p>
                <button
                  type="button"
                  onClick={() => setShowTemplates((v) => !v)}
                  className="text-xs text-primary underline underline-offset-2"
                >
                  {showTemplates ? "Hide templates" : "Browse templates"}
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Templates */}
              {showTemplates && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Click a template to pre-fill. You can edit before saving.
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

              {/* Question text */}
              <div className="space-y-2">
                <Label htmlFor="draft-text">
                  Question <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="draft-text"
                  placeholder="What industry are you in?"
                  value={draft.text}
                  onChange={(e) => {
                    setDraft((d) => d && { ...d, text: e.target.value });
                    setDraftError(null);
                  }}
                  autoFocus
                />
              </div>

              {/* Answer type */}
              <div className="space-y-2">
                <Label>Answer type</Label>
                <Select
                  value={draft.type}
                  onValueChange={(v) => {
                    setDraft((d) => d && { ...d, type: v as QuestionType });
                    setDraftError(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_choice">Single choice — pick one option</SelectItem>
                    <SelectItem value="multiple_choice">Multiple choice — pick all that apply</SelectItem>
                    <SelectItem value="scale">Scale — rate on a numeric range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Options */}
              {draftNeedsOptions && (
                <div className="space-y-2">
                  <Label htmlFor="draft-options">
                    Options <span className="text-destructive">*</span>{" "}
                    <span className="text-muted-foreground font-normal">(one per line, min 2)</span>
                  </Label>
                  <Textarea
                    id="draft-options"
                    placeholder={"Investor\nFounder\nOperator\nAdvisor"}
                    rows={4}
                    value={draft.options}
                    onChange={(e) => {
                      setDraft((d) => d && { ...d, options: e.target.value });
                      setDraftError(null);
                    }}
                  />
                </div>
              )}

              {/* Scale range */}
              {draft.type === "scale" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="draft-scaleMin">Min value</Label>
                    <Input
                      id="draft-scaleMin"
                      type="number"
                      value={draft.scaleMin}
                      min={0} max={9}
                      onChange={(e) => setDraft((d) => d && { ...d, scaleMin: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="draft-scaleMax">Max value</Label>
                    <Input
                      id="draft-scaleMax"
                      type="number"
                      value={draft.scaleMax}
                      min={1} max={100}
                      onChange={(e) => setDraft((d) => d && { ...d, scaleMax: Number(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              {/* Weight */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Matching weight</Label>
                  <span className="text-sm font-medium">{draft.weight} / 10</span>
                </div>
                <Slider
                  min={1} max={10} step={1}
                  value={[draft.weight]}
                  onValueChange={([val]) => setDraft((d) => d && { ...d, weight: val })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low influence on matching</span>
                  <span>High influence on matching</span>
                </div>
              </div>

              {/* Validation error */}
              {draftError && (
                <p className="text-sm text-destructive">{draftError}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {questions.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setDraft(null); setDraftError(null); }}
                    disabled={isPending}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isPending}
                  className="flex-1"
                >
                  {isPending ? "Saving…" : "Save question"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add another question button */}
      {!draft && questions.length < 10 && (
        <>
          {questions.length > 0 && <Separator />}
          <Button
            type="button"
            variant="outline"
            onClick={() => openDraft()}
            className="w-full"
          >
            + Add another question
          </Button>
        </>
      )}

      {questions.length >= 3 && !draft && (
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
