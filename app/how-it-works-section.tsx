"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Zap } from "lucide-react";

const QUESTIONS = [
  {
    q: "What's your primary role?",
    options: ["Founder", "Investor", "Engineer", "Designer"],
    answer: 0,
  },
  {
    q: "What stage is your company?",
    options: ["Pre-seed", "Seed", "Series A", "Series B+"],
    answer: 1,
  },
  {
    q: "What are you looking for?",
    options: ["Co-founder", "Investment", "Mentorship", "Customers"],
    answer: 2,
  },
];

const MATCHES = [
  { name: "Alex K.", role: "Investor · Early Stage", score: 94, color: "bg-emerald-500" },
  { name: "Nina R.", role: "VC · Series A", score: 87, color: "bg-sky-500" },
  { name: "Tom B.", role: "CTO · Dev Tools", score: 79, color: "bg-violet-500" },
];

const STEPS = [
  {
    num: "01",
    title: "Attendee joins",
    desc: "They open the unique link or scan your QR code. No account or download needed — just their name and email.",
  },
  {
    num: "02",
    title: "Answers questions",
    desc: "A short step-by-step questionnaire on mobile. Each question has a weighted impact on the final compatibility score.",
  },
  {
    num: "03",
    title: "Sees their matches",
    desc: "After you run the engine, attendees get a ranked list of their most compatible connections at the event.",
  },
];

export default function HowItWorksSection() {
  const [phase, setPhase] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  function goTo(p: number) {
    setPhase(p);
    setQIndex(0);
    setAnimKey((k) => k + 1);
  }

  useEffect(() => {
    if (phase === 0) {
      const t = setTimeout(() => goTo(1), 3200);
      return () => clearTimeout(t);
    }
    if (phase === 1) {
      if (qIndex < QUESTIONS.length - 1) {
        const t = setTimeout(() => {
          setQIndex((q) => q + 1);
          setAnimKey((k) => k + 1);
        }, 2200);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => goTo(2), 2200);
        return () => clearTimeout(t);
      }
    }
    if (phase === 2) {
      const t = setTimeout(() => goTo(0), 4000);
      return () => clearTimeout(t);
    }
  }, [phase, qIndex]);

  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <div className="text-center space-y-3 mb-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          How it works
        </p>
        <h2 className="text-4xl font-extrabold tracking-tight">
          From link to matched pairs
          <br />
          in minutes
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Step list */}
        <div className="space-y-3 order-2 lg:order-1">
          {STEPS.map((step, i) => (
            <button
              key={step.num}
              onClick={() => goTo(i)}
              className={`w-full text-left flex gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                phase === i
                  ? "border-primary/30 bg-primary/5 shadow-sm"
                  : "border-transparent hover:border-border hover:bg-muted/40"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  phase === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <span className="text-sm font-black">{step.num}</span>
              </div>
              <div className="space-y-1 min-w-0">
                <p
                  className={`font-semibold transition-colors duration-300 ${
                    phase === i ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Phone mockup */}
        <div className="order-1 lg:order-2 flex justify-center">
          <div className="w-full max-w-[320px]">
            <div className="rounded-[2.5rem] border-4 border-foreground/10 bg-card shadow-2xl overflow-hidden">
              {/* Status bar */}
              <div className="bg-slate-950 px-6 pt-3 pb-2 flex items-center justify-between">
                <span className="text-[10px] text-white/40 font-medium">9:41</span>
                <div className="flex gap-1 items-center">
                  <div className="w-3 h-1.5 rounded-sm bg-white/30" />
                  <div className="w-3 h-1.5 rounded-sm bg-white/30" />
                </div>
              </div>

              {/* Screen */}
              <div className="bg-background min-h-[460px] p-5" key={animKey}>
                {phase === 0 && <JoinScreen />}
                {phase === 1 && (
                  <QuestionScreen
                    q={QUESTIONS[qIndex]}
                    index={qIndex}
                    total={QUESTIONS.length}
                  />
                )}
                {phase === 2 && <MatchScreen />}
              </div>
            </div>

            {/* Phase dots */}
            <div className="flex justify-center gap-2 mt-5">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    phase === i ? "bg-primary w-6" : "bg-muted-foreground/30 w-1.5"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function JoinScreen() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-5 pt-2">
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          TechConnect 2025
        </p>
        <h3 className="text-lg font-bold leading-snug">
          Find your best connections at this event
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Answer 4 quick questions and we&apos;ll match you with the most
          compatible people here.
        </p>
      </div>

      <div className="space-y-2.5">
        <div className="rounded-xl border bg-muted/40 px-4 py-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">Your name</p>
          <p className="text-sm font-medium">Sarah Mitchell</p>
        </div>
        <div className="rounded-xl border bg-muted/40 px-4 py-3">
          <p className="text-[10px] text-muted-foreground mb-0.5">Email address</p>
          <p className="text-sm font-medium">sarah@techco.io</p>
        </div>
      </div>

      <div className="rounded-xl bg-primary px-4 py-3 flex items-center justify-between cursor-pointer">
        <span className="text-sm font-semibold text-primary-foreground">
          Get started
        </span>
        <ArrowRight className="w-4 h-4 text-primary-foreground" />
      </div>

      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        No account needed
      </span>
    </div>
  );
}

function QuestionScreen({
  q,
  index,
  total,
}: {
  q: (typeof QUESTIONS)[0];
  index: number;
  total: number;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-400 space-y-5 pt-2">
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Question {index + 1} of {total}</span>
          <span>{Math.round(((index + 1) / total) * 100)}%</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <p className="text-sm font-bold leading-snug">{q.q}</p>

      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <div
            key={opt}
            className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors ${
              i === q.answer
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                i === q.answer
                  ? "border-primary"
                  : "border-muted-foreground/30"
              }`}
            >
              {i === q.answer && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-xs font-medium">{opt}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-1">
        <div className="rounded-xl border px-4 py-2 text-xs text-muted-foreground">
          ← Back
        </div>
        <div className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground flex items-center gap-1.5">
          Next <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

function MatchScreen() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-4 pt-2">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-bold">Your matches are ready</p>
          <p className="text-[10px] text-muted-foreground">TechConnect 2025</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {MATCHES.map((m, i) => (
          <div
            key={m.name}
            className="rounded-xl border bg-card p-3.5 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: `${i * 150}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold">{m.name}</p>
                <p className="text-[10px] text-muted-foreground">{m.role}</p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${m.color}`}
              >
                {m.score}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${m.color} transition-all duration-700`}
                style={{ width: `${m.score}%`, transitionDelay: `${i * 150 + 200}ms` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground text-center pt-1">
        Ranked by compatibility score
      </p>
    </div>
  );
}
