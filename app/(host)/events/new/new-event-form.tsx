"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createEvent } from "../actions";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users2, Globe, Building2, Zap } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType = "single_choice" | "multiple_choice" | "scale";

interface DraftQuestion {
  text: string;
  type: QuestionType;
  options: string[] | null;
  weight: number;
  scaleMin: number | null;
  scaleMax: number | null;
  order: number;
}

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

interface QuestionTemplate {
  text: string;
  type: QuestionType;
  options?: string;
  scaleMin?: number;
  scaleMax?: number;
  weight: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

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

const TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  scale: "Scale",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  error?: string;
}

export function NewEventForm({ error }: Props) {
  // Event detail state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [matchingMode, setMatchingMode] = useState("general");
  const [matchCount, setMatchCount] = useState("3");
  const [isPending, startTransition] = useTransition();

  // Group name state (two_sided only)
  const [groupAName, setGroupAName] = useState("Investors");
  const [groupBName, setGroupBName] = useState("Founders");

  // Question builder state
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]);
  const [qType, setQType] = useState<QuestionType>("single_choice");
  const [qText, setQText] = useState("");
  const [qOptions, setQOptions] = useState("");
  const [qWeight, setQWeight] = useState(5);
  const [qScaleMin, setQScaleMin] = useState(1);
  const [qScaleMax, setQScaleMax] = useState(10);
  const [showTemplates, setShowTemplates] = useState(false);

  const needsOptions = qType === "single_choice" || qType === "multiple_choice";

  function applyEventTemplate(t: EventTemplate) {
    setSelectedTemplate(t.id);
    setDescription(t.eventDescription);
    setMatchingMode(t.matchingMode);
    setMatchCount(t.matchCount);
    if (t.matchingMode === "two_sided") {
      setGroupAName("Investors");
      setGroupBName("Founders");
    }
  }

  function applyQuestionTemplate(t: QuestionTemplate) {
    setQText(t.text);
    setQType(t.type);
    setQOptions(t.options ?? "");
    setQWeight(t.weight);
    setQScaleMin(t.scaleMin ?? 1);
    setQScaleMax(t.scaleMax ?? 10);
    setShowTemplates(false);
    document.getElementById("add-question-form")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleAddQuestion() {
    if (!qText.trim()) return;
    if (draftQuestions.length >= 10) return;

    const options =
      needsOptions
        ? qOptions.split("\n").map((o) => o.trim()).filter(Boolean)
        : null;

    const newQ: DraftQuestion = {
      text: qText.trim(),
      type: qType,
      options,
      weight: qWeight,
      scaleMin: qType === "scale" ? qScaleMin : null,
      scaleMax: qType === "scale" ? qScaleMax : null,
      order: draftQuestions.length,
    };

    setDraftQuestions((prev) => [...prev, newQ]);
    setQText("");
    setQOptions("");
    setQWeight(5);
  }

  function handleDeleteQuestion(index: number) {
    setDraftQuestions((prev) =>
      prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i }))
    );
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    setDraftQuestions((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((q, i) => ({ ...q, order: i }));
    });
  }

  function handleMoveDown(index: number) {
    if (index === draftQuestions.length - 1) return;
    setDraftQuestions((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((q, i) => ({ ...q, order: i }));
    });
  }

  function handleWeightChange(index: number, newWeight: number) {
    setDraftQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, weight: newWeight } : q))
    );
  }

  function handleSubmit(formData: FormData) {
    formData.set("description", description);
    formData.set("matchingMode", matchingMode);
    formData.set("matchCount", matchCount);
    formData.set("questions", JSON.stringify(draftQuestions));
    if (matchingMode === "two_sided") {
      formData.set("groupA", groupAName.trim() || "Group A");
      formData.set("groupB", groupBName.trim() || "Group B");
    }
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
                onClick={() => applyEventTemplate(t)}
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
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium">Name your two groups</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Attendees will pick which group they belong to when they sign up.
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      value={groupAName}
                      onChange={(e) => setGroupAName(e.target.value)}
                      placeholder="e.g. Investors"
                    />
                    <span className="text-muted-foreground text-sm shrink-0">↔</span>
                    <Input
                      value={groupBName}
                      onChange={(e) => setGroupBName(e.target.value)}
                      placeholder="e.g. Founders"
                    />
                  </div>
                </div>
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

        {/* Questions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Questions</CardTitle>
            <CardDescription>
              You need at least 3 questions before you can open the event.
              You can also add or edit questions after creating.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${Math.min((draftQuestions.length / 3) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {draftQuestions.length} / 10
                {draftQuestions.length < 3 && ` · need ${3 - draftQuestions.length} more`}
                {draftQuestions.length >= 3 && " · ready to open"}
              </span>
            </div>

            {/* Existing draft questions */}
            {draftQuestions.length > 0 && (
              <div className="space-y-3">
                {draftQuestions.map((q, index) => (
                  <div key={index} className="rounded-lg border bg-muted/20 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground font-medium">Q{index + 1}</span>
                          <Badge variant="outline" className="text-xs">{TYPE_LABELS[q.type]}</Badge>
                          <Badge variant="secondary" className="text-xs">Weight {q.weight}</Badge>
                        </div>
                        <p className="text-sm font-medium leading-snug">{q.text}</p>
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
                          variant="ghost" size="icon" className="h-7 w-7" type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          title="Move up"
                        >↑</Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7" type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === draftQuestions.length - 1}
                          title="Move down"
                        >↓</Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" type="button"
                          onClick={() => handleDeleteQuestion(index)}
                          title="Delete"
                        >×</Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Matching weight</Label>
                        <span className="text-xs font-medium">{q.weight} / 10</span>
                      </div>
                      <Slider
                        min={1} max={10} step={1}
                        value={[q.weight]}
                        onValueChange={([val]) => handleWeightChange(index, val)}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {draftQuestions.length >= 10 && (
              <p className="text-sm text-center text-muted-foreground">Maximum of 10 questions reached.</p>
            )}

            {/* Add question form */}
            {draftQuestions.length < 10 && (
              <>
                {draftQuestions.length > 0 && <Separator />}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {draftQuestions.length === 0 ? "Add your first question" : "Add another question"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowTemplates((v) => !v)}
                      className="text-xs text-primary underline underline-offset-2"
                    >
                      {showTemplates ? "Hide templates" : "Browse templates"}
                    </button>
                  </div>

                  {showTemplates && (
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Click a template to pre-fill the form below.
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
                                onClick={() => applyQuestionTemplate(t)}
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

                  <div id="add-question-form" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="qText">Question</Label>
                      <Input
                        id="qText"
                        placeholder="What industry are you in?"
                        value={qText}
                        onChange={(e) => setQText(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="qType">Answer type</Label>
                      <Select value={qType} onValueChange={(v) => setQType(v as QuestionType)}>
                        <SelectTrigger id="qType">
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
                        <Label htmlFor="qOptions">
                          Options{" "}
                          <span className="text-muted-foreground font-normal">(one per line, min 2)</span>
                        </Label>
                        <Textarea
                          id="qOptions"
                          placeholder={"Investor\nFounder\nOperator\nAdvisor"}
                          rows={4}
                          value={qOptions}
                          onChange={(e) => setQOptions(e.target.value)}
                        />
                      </div>
                    )}

                    {qType === "scale" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="qScaleMin">Min value</Label>
                          <Input
                            id="qScaleMin"
                            type="number"
                            value={qScaleMin}
                            onChange={(e) => setQScaleMin(Number(e.target.value))}
                            min={0} max={9}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qScaleMax">Max value</Label>
                          <Input
                            id="qScaleMax"
                            type="number"
                            value={qScaleMax}
                            onChange={(e) => setQScaleMax(Number(e.target.value))}
                            min={1} max={100}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Matching weight</Label>
                        <span className="text-sm font-medium">{qWeight} / 10</span>
                      </div>
                      <Slider
                        min={1} max={10} step={1}
                        value={[qWeight]}
                        onValueChange={([val]) => setQWeight(val)}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Low influence on matching</span>
                        <span>High influence on matching</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleAddQuestion}
                      disabled={!qText.trim() || (needsOptions && qOptions.split("\n").filter((o) => o.trim()).length < 2)}
                    >
                      + Add question
                    </Button>
                  </div>
                </div>
              </>
            )}
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
