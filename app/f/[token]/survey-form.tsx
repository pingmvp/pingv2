"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { submitSurvey } from "./actions";
import { Zap, Check } from "lucide-react";

type MatchAccess = "yes" | "no" | "other";

interface Props {
  attendeeId: string;
  eventId: string;
  token: string;
  attendeeName: string;
}

export function SurveyForm({ attendeeId, eventId, token, attendeeName }: Props) {
  const [easeOfNavigation, setEaseOfNavigation] = useState<number | null>(null);
  const [matchAccess, setMatchAccess] = useState<MatchAccess | null>(null);
  const [matchAccessOther, setMatchAccessOther] = useState("");
  const [matchAlignment, setMatchAlignment] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const otherInputRef = useRef<HTMLInputElement>(null);

  // Focus the "Other" text input as soon as it appears
  useEffect(() => {
    if (matchAccess === "other") {
      const t = setTimeout(() => otherInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [matchAccess]);

  const allAnswered =
    easeOfNavigation !== null &&
    matchAccess !== null &&
    matchAlignment !== null &&
    (matchAccess !== "other" || matchAccessOther.trim().length > 0);

  function clearError(key: string) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleSubmit() {
    const errors: Record<string, string> = {};
    if (easeOfNavigation === null) errors.ease = "Please select a rating.";
    if (matchAccess === null) errors.access = "Please select an option.";
    if (matchAccess === "other" && !matchAccessOther.trim())
      errors.accessOther = "Please describe your experience.";
    if (matchAlignment === null) errors.alignment = "Please select a rating.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    startTransition(() =>
      submitSurvey(attendeeId, eventId, token, {
        easeOfNavigation: easeOfNavigation!,
        matchAccess: matchAccess!,
        matchAccessOther: matchAccessOther.trim() || undefined,
        matchAlignment: matchAlignment!,
      })
    );
  }

  const firstName = attendeeName.split(" ")[0];

  // ── Submitting overlay ──────────────────────────────────────────────────────

  if (isSubmitting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-6">
        <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center">
          <Zap
            className="w-8 h-8 text-background animate-pulse"
            strokeWidth={2.5}
          />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold">Submitting your feedback…</h2>
          <p className="text-sm text-muted-foreground">Just a moment.</p>
        </div>
      </div>
    );
  }

  // ── Survey form ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Top bar */}
      <div className="flex items-center px-6 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-background" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight">Togly</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 flex justify-center px-6 py-10">
        <div className="w-full max-w-md space-y-12">

          {/* Header */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Post-event survey
            </p>
            <h1 className="text-3xl font-bold tracking-tight leading-tight">
              How was your experience, {firstName}?
            </h1>
            <p className="text-sm text-muted-foreground">
              3 quick questions — takes under a minute.
            </p>
          </div>

          {/* ── Q1: Ease of navigation ──────────────────────────────── */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Question 1 of 3
              </p>
              <h2 className="text-lg font-bold leading-snug">
                How easy was it to navigate and use the app?
              </h2>
            </div>

            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => {
                const sel = easeOfNavigation === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setEaseOfNavigation(n);
                      clearError("ease");
                    }}
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

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very difficult</span>
              <span>Very easy</span>
            </div>

            {fieldErrors.ease && (
              <p className="text-sm text-destructive">{fieldErrors.ease}</p>
            )}
          </div>

          {/* ── Q2: Match access ────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Question 2 of 3
              </p>
              <h2 className="text-lg font-bold leading-snug">
                Were you able to find and access your matches without any
                issues?
              </h2>
            </div>

            <div className="space-y-2.5">
              {(["yes", "no", "other"] as const).map((opt) => {
                const sel = matchAccess === opt;
                const labels: Record<MatchAccess, string> = {
                  yes: "Yes",
                  no: "No",
                  other: "Other",
                };
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setMatchAccess(opt);
                      clearError("access");
                      clearError("accessOther");
                    }}
                    className={[
                      "w-full text-left rounded-xl border-2 px-5 py-4 font-medium transition-all duration-150",
                      sel
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card hover:border-foreground/50 hover:bg-muted/40",
                    ].join(" ")}
                  >
                    {labels[opt]}
                  </button>
                );
              })}
            </div>

            {/* Revealed text field when "Other" is selected */}
            {matchAccess === "other" && (
              <div className="pt-1 animate-in slide-in-from-top-2 fade-in duration-200">
                <input
                  ref={otherInputRef}
                  type="text"
                  value={matchAccessOther}
                  onChange={(e) => {
                    setMatchAccessOther(e.target.value);
                    clearError("accessOther");
                  }}
                  placeholder="Please describe your experience…"
                  className="w-full text-base bg-transparent border-b-2 border-muted-foreground/30 focus:border-foreground pb-2 outline-none transition-colors placeholder:text-muted-foreground/30"
                />
              </div>
            )}

            {fieldErrors.access && (
              <p className="text-sm text-destructive">{fieldErrors.access}</p>
            )}
            {fieldErrors.accessOther && (
              <p className="text-sm text-destructive">
                {fieldErrors.accessOther}
              </p>
            )}
          </div>

          {/* ── Q3: Match alignment ─────────────────────────────────── */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Question 3 of 3
              </p>
              <h2 className="text-lg font-bold leading-snug">
                How well did your matches align with what you were looking for?
              </h2>
            </div>

            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => {
                const sel = matchAlignment === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setMatchAlignment(n);
                      clearError("alignment");
                    }}
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

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Not at all</span>
              <span>5 = perfectly matched my needs</span>
            </div>

            {fieldErrors.alignment && (
              <p className="text-sm text-destructive">{fieldErrors.alignment}</p>
            )}
          </div>

          {/* ── Submit ──────────────────────────────────────────────── */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered}
            className={[
              "w-full flex items-center justify-center gap-2 rounded-xl h-14 text-base font-semibold transition-all",
              allAnswered
                ? "bg-foreground text-background hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            ].join(" ")}
          >
            <Check className="w-5 h-5" strokeWidth={2.5} />
            Submit feedback
          </button>

          {/* Bottom padding so the submit button doesn't sit flush at the edge on mobile */}
          <div className="h-6" />

        </div>
      </div>
    </div>
  );
}
