"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { submitQuestionnaire } from "./actions";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, ArrowRight, Check, Zap } from "lucide-react";

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

interface EventInfo {
  name: string;
  description: string | null;
  matchCount: number;
}

interface Group {
  id: string;
  name: string;
}

interface Props {
  eventId: string;
  event: EventInfo;
  questions: Question[];
  groups: Group[];
  serverError?: string;
}

type Answers = Record<string, string | string[] | number>;

// Steps: 0=welcome, 1=name, 2=phone, 3..n+2=questions, n+3=ready
// Plus an isSubmitting overlay when the server action is running

export function QuestionnaireForm({ eventId, event, questions, groups, serverError }: Props) {
  const hasGroups = groups.length >= 2;
  const questionStepStart = hasGroups ? 4 : 3; // step index where questions begin
  const totalSteps = (hasGroups ? 3 : 2) + questions.length;
  const readyStep = totalSteps + 1;

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"fwd" | "bwd">("fwd");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const progress = step === 0 ? 0 : Math.min(Math.round((step / totalSteps) * 100), 100);
  const questionIndex = step - questionStepStart; // 0-based index into questions[]
  const currentQuestion = questionIndex >= 0 && questionIndex < questions.length
    ? questions[questionIndex]
    : null;

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [step]);

  function advance() {
    setDir("fwd");
    setStep((s) => s + 1);
    setFieldError(null);
  }

  function back() {
    setDir("bwd");
    setStep((s) => Math.max(0, s - 1));
    setFieldError(null);
  }

  // ── Contact field handlers ──────────────────────────────────

  function handleNameNext() {
    if (!name.trim()) { setFieldError("Please enter your name."); return; }
    advance();
  }

  function handlePhoneNext() {
    const v = phone.trim();
    if (!v) { setFieldError("Please enter your phone number."); return; }
    if (!/^\+?[\d\s\-().]{7,}$/.test(v)) {
      setFieldError("Please enter a valid phone number (e.g. +1 555 000 0000).");
      return;
    }
    advance();
  }

  // ── Answer handlers ─────────────────────────────────────────

  function pickSingle(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setTimeout(advance, 320);
  }

  function toggleMultiple(questionId: string, value: string) {
    setAnswers((prev) => {
      const cur = (prev[questionId] as string[]) ?? [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...prev, [questionId]: next };
    });
  }

  function pickScale(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setTimeout(advance, 320);
  }

  function setScale(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  const multiSelected = useCallback(
    (qId: string) => (answers[qId] as string[] | undefined) ?? [],
    [answers]
  );

  // ── Submit ──────────────────────────────────────────────────

  function handleSubmit() {
    setIsSubmitting(true);
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("phone", phone.trim());
    if (selectedGroupId) fd.set("groupId", selectedGroupId);
    for (const q of questions) {
      const val = answers[q.id];
      if (val === undefined) continue;
      if (Array.isArray(val)) {
        val.forEach((v) => fd.append(`q_${q.id}`, v));
      } else {
        fd.set(`q_${q.id}`, String(val));
      }
    }
    startTransition(() => submitQuestionnaire(eventId, fd));
  }

  // ── Submitting overlay ──────────────────────────────────────

  if (isSubmitting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-6">
        <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center">
          <Zap className="w-8 h-8 text-background animate-pulse" strokeWidth={2.5} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold">Finding your matches…</h2>
          <p className="text-sm text-muted-foreground">Sit tight while we process your responses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background select-none">

      {/* ── Progress bar ─────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-20 h-1 bg-muted">
        <div
          className="h-full bg-foreground transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-background" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight">Ping</span>
        </div>
        {step > 0 && step < readyStep && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {step} / {totalSteps}
          </span>
        )}
      </div>

      {/* ── Slide content ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div
          key={step}
          className={[
            "w-full max-w-md",
            dir === "fwd"
              ? "animate-in slide-in-from-right-8 fade-in duration-300"
              : "animate-in slide-in-from-left-8 fade-in duration-300",
          ].join(" ")}
        >

          {/* ── 0: Welcome ──────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  You&apos;re invited
                </p>
                <h1 className="text-3xl font-bold tracking-tight leading-tight">
                  {event.name}
                </h1>
                {event.description && (
                  <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                )}
              </div>

              <div className="rounded-xl border bg-muted/40 px-5 py-4 space-y-1.5">
                <p className="text-sm font-semibold">How it works</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Answer {questions.length} quick questions and we&apos;ll find your top{" "}
                  {event.matchCount} {event.matchCount === 1 ? "match" : "matches"} at the
                  event — delivered by text message.
                </p>
              </div>

              {serverError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {decodeURIComponent(serverError)}
                </div>
              )}

              <button
                type="button"
                onClick={advance}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground text-background h-14 text-base font-semibold hover:opacity-90 transition-opacity"
              >
                Get started <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ── 1: Name ─────────────────────────────────────── */}
          {step === 1 && (
            <FieldStep
              label="What's your name?"
              hint={null}
              error={fieldError}
            >
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
                placeholder="Alex Chen"
                autoComplete="name"
                className="w-full text-2xl font-medium bg-transparent border-b-2 border-muted-foreground/30 focus:border-foreground pb-3 outline-none transition-colors placeholder:text-muted-foreground/30"
              />
              <ContinueButton onClick={handleNameNext} />
            </FieldStep>
          )}

          {/* ── 2: Phone ────────────────────────────────────── */}
          {step === 2 && (
            <FieldStep
              label="What's your phone number?"
              hint="We'll text your matches to this number before the event."
              error={fieldError}
            >
              <input
                ref={inputRef}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePhoneNext()}
                placeholder="+1 (555) 000-0000"
                autoComplete="tel"
                className="w-full text-2xl font-medium bg-transparent border-b-2 border-muted-foreground/30 focus:border-foreground pb-3 outline-none transition-colors placeholder:text-muted-foreground/30"
              />
              <ContinueButton onClick={handlePhoneNext} />
            </FieldStep>
          )}

          {/* ── 3: Group picker (two-sided only) ───────────── */}
          {step === 3 && hasGroups && (
            <div className="space-y-8">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  About you
                </p>
                <h2 className="text-2xl font-bold leading-snug">Which best describes you?</h2>
              </div>
              <div className="space-y-2.5">
                {groups.map((g) => {
                  const sel = selectedGroupId === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setSelectedGroupId(g.id);
                        setTimeout(advance, 320);
                      }}
                      className={[
                        "w-full text-left rounded-xl border-2 px-5 py-4 font-medium transition-all duration-150",
                        sel
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card hover:border-foreground/50 hover:bg-muted/40",
                      ].join(" ")}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 3..n+2 / 4..n+3: Questions ─────────────────── */}
          {currentQuestion && (
            <div className="space-y-8">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Question {questionIndex + 1} of {questions.length}
                </p>
                <h2 className="text-2xl font-bold leading-snug">{currentQuestion.text}</h2>
              </div>

              {/* Single choice */}
              {currentQuestion.type === "single_choice" && currentQuestion.options && (
                <div className="space-y-2.5">
                  {currentQuestion.options.map((opt) => {
                    const sel = answers[currentQuestion.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => pickSingle(currentQuestion.id, opt)}
                        className={[
                          "w-full text-left rounded-xl border-2 px-5 py-4 font-medium transition-all duration-150",
                          sel
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-card hover:border-foreground/50 hover:bg-muted/40",
                        ].join(" ")}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Multiple choice */}
              {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground -mt-4">Select all that apply</p>
                  <div className="space-y-2.5">
                    {currentQuestion.options.map((opt) => {
                      const sel = multiSelected(currentQuestion.id).includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleMultiple(currentQuestion.id, opt)}
                          className={[
                            "w-full text-left rounded-xl border-2 px-5 py-4 font-medium transition-all duration-150 flex items-center justify-between gap-3",
                            sel
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-card hover:border-foreground/50 hover:bg-muted/40",
                          ].join(" ")}
                        >
                          <span>{opt}</span>
                          {sel && <Check className="w-4 h-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  <ContinueButton
                    onClick={() => multiSelected(currentQuestion.id).length > 0 && advance()}
                    disabled={multiSelected(currentQuestion.id).length === 0}
                  />
                </div>
              )}

              {/* Scale */}
              {currentQuestion.type === "scale" && (() => {
                const min = currentQuestion.scaleMin ?? 1;
                const max = currentQuestion.scaleMax ?? 10;
                const range = max - min + 1;
                const cur = answers[currentQuestion.id] as number | undefined;

                if (range <= 11) {
                  return (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: range }, (_, i) => min + i).map((n) => {
                          const sel = cur === n;
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => pickScale(currentQuestion.id, n)}
                              className={[
                                "w-12 h-12 rounded-xl border-2 font-semibold text-sm transition-all duration-150",
                                sel
                                  ? "border-foreground bg-foreground text-background scale-110 shadow-md"
                                  : "border-border bg-card hover:border-foreground/50 hover:bg-muted/40",
                              ].join(" ")}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <span>{min}</span>
                        <span>{max}</span>
                      </div>
                    </div>
                  );
                }

                const sliderVal = cur ?? Math.round((min + max) / 2);
                return (
                  <div className="space-y-6">
                    <div className="text-center">
                      <span className="text-6xl font-bold tabular-nums">{sliderVal}</span>
                    </div>
                    <Slider
                      min={min}
                      max={max}
                      step={1}
                      value={[sliderVal]}
                      onValueChange={([v]) => setScale(currentQuestion.id, v)}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{min}</span>
                      <span>{max}</span>
                    </div>
                    <ContinueButton
                      onClick={() => {
                        setScale(currentQuestion.id, sliderVal);
                        advance();
                      }}
                    />
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── n+3: Ready to submit ─────────────────────────── */}
          {step === readyStep && (
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <Check className="w-7 h-7 text-emerald-600" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-bold">You&apos;re all set, {name.split(" ")[0]}!</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We&apos;ll match you with the {event.matchCount} best{" "}
                  {event.matchCount === 1 ? "person" : "people"} to meet and text you before the event.
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{phone}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Answers</span>
                  <span className="font-medium">{questions.length} questions</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground text-background h-14 text-base font-semibold hover:opacity-90 transition-opacity"
              >
                <Zap className="w-5 h-5" strokeWidth={2.5} />
                Find my matches
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── Back button ───────────────────────────────────────── */}
      {step > 0 && step <= readyStep && (
        <div className="fixed bottom-6 left-6">
          <button
            type="button"
            onClick={back}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function FieldStep({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint: string | null;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{label}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function ContinueButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-full flex items-center justify-center gap-2 rounded-xl h-14 text-base font-semibold transition-all",
        disabled
          ? "bg-muted text-muted-foreground cursor-not-allowed"
          : "bg-foreground text-background hover:opacity-90",
      ].join(" ")}
    >
      Continue <ArrowRight className="w-5 h-5" />
    </button>
  );
}
