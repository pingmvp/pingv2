import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Users,
  MessageSquare,
  BarChart3,
  Sparkles,
  Clock,
  Shield,
} from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <Zap className="w-4 h-4 text-background" strokeWidth={2.5} />
            </div>
            <span className="font-bold tracking-tight">Ping</span>
          </div>
          <Link href="/login">
            <Button size="sm" variant="outline">
              Sign in
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left copy */}
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3.5 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="w-3 h-3" />
            AI-powered event matching
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1]">
            Turn attendees into{" "}
            <span className="bg-gradient-to-r from-violet-600 to-sky-500 bg-clip-text text-transparent">
              meaningful connections
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
            Ping matches your event attendees by compatibility, then delivers
            their top connections via SMS — no app, no friction.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login">
              <Button size="lg" className="gap-2 shadow-sm">
                <Zap className="w-4 h-4" />
                Get started free
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              No app required
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              SMS delivery
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              5-min setup
            </span>
          </div>
        </div>

        {/* Right — phone mockup */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative">
            {/* Phone shell */}
            <div className="w-[260px] h-[520px] rounded-[3rem] bg-foreground border-[6px] border-foreground shadow-2xl overflow-hidden relative">
              {/* Screen */}
              <div className="absolute inset-0 bg-slate-950 flex flex-col">
                {/* Status bar */}
                <div className="flex justify-between items-center px-5 pt-3 pb-1">
                  <span className="text-white/60 text-[10px] font-medium">9:41</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-1.5 rounded-sm bg-white/40" />
                    <div className="w-3 h-1.5 rounded-sm bg-white/40" />
                  </div>
                </div>

                {/* Header */}
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-white/50 text-[10px]">Messages</p>
                  <p className="text-white text-sm font-semibold">Ping ⚡</p>
                </div>

                {/* Messages */}
                <div className="flex-1 px-4 py-4 space-y-3 overflow-hidden">
                  <Bubble text="Hey Sarah! You're registered for TechConnect 2025. We'll text your matches before the event 🎉" />
                  <Bubble text="Your top matches are ready:" right />
                  <MatchCard name="Jordan Lee" tag="Also a founder · Loves distributed systems" />
                  <MatchCard name="Alex Chen" tag="Investor focused on B2B SaaS" />
                  <Bubble text="Find them at the venue and make the connection. Good luck! 🤝" />
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-8 bg-white rounded-2xl shadow-lg border px-4 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
                J
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Jordan Lee</p>
                <p className="text-[10px] text-muted-foreground">94% match</p>
              </div>
            </div>

            {/* Floating stat */}
            <div className="absolute -bottom-4 -left-8 bg-white rounded-2xl shadow-lg border px-4 py-2.5">
              <p className="text-[10px] text-muted-foreground">Matches delivered</p>
              <p className="text-xl font-bold text-foreground">1,240</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-20 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              From setup to delivered matches in three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create your event",
                desc: "Set custom questions, matching goals, and how many connections each attendee should receive.",
              },
              {
                step: "02",
                title: "Attendees respond",
                desc: "Share a link or QR code. Attendees complete a quick mobile questionnaire — no signup needed.",
              },
              {
                step: "03",
                title: "Matches delivered",
                desc: "Our engine scores every pair. Each attendee gets their top matches via SMS before the event starts.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative space-y-3">
                <div className="text-5xl font-black text-muted/60 select-none">{step}</div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Built for event hosts who want measurable networking outcomes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: Sparkles,
              title: "Smart matching engine",
              desc: "Weighted compatibility scoring across multiple question types — single choice, multi-select, and scale.",
              color: "bg-violet-50 text-violet-600",
            },
            {
              icon: MessageSquare,
              title: "SMS delivery",
              desc: "Matches land directly in attendees' messages at event start. No app download or login required.",
              color: "bg-sky-50 text-sky-600",
            },
            {
              icon: Users,
              title: "Two-sided matching",
              desc: "Match investors with founders, mentors with mentees, or any two distinct groups at your event.",
              color: "bg-emerald-50 text-emerald-600",
            },
            {
              icon: Clock,
              title: "5-minute setup",
              desc: "Pick from question templates, set your match count, and go live in minutes.",
              color: "bg-amber-50 text-amber-600",
            },
            {
              icon: BarChart3,
              title: "Live response tracking",
              desc: "Watch registrations arrive in real time from your event dashboard.",
              color: "bg-rose-50 text-rose-600",
            },
            {
              icon: Shield,
              title: "No friction for attendees",
              desc: "A single link is all they need. No accounts, no downloads, no app stores.",
              color: "bg-indigo-50 text-indigo-600",
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="rounded-2xl border bg-card p-5 space-y-3 hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-3xl bg-foreground text-background px-8 py-14 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-background/10 flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6 text-background" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to make your event memorable?
          </h2>
          <p className="text-background/70 max-w-sm mx-auto">
            Set up your first event in minutes. No credit card required.
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="gap-2 shadow-sm">
              <Zap className="w-4 h-4" />
              Start for free
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            <span className="font-semibold">Ping</span>
          </div>
          <span>© {new Date().getFullYear()} Ping. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

// ── Phone mockup sub-components ──────────────────────────────

function Bubble({ text, right }: { text: string; right?: boolean }) {
  return (
    <div className={`flex ${right ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-[10px] leading-snug ${
          right
            ? "bg-indigo-500 text-white rounded-br-sm"
            : "bg-white/10 text-white/90 rounded-bl-sm"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function MatchCard({ name, tag }: { name: string; tag: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-full bg-violet-400/30 flex items-center justify-center text-violet-300 font-bold text-[10px] shrink-0">
        {name.charAt(0)}
      </div>
      <div className="min-w-0">
        <p className="text-white text-[10px] font-semibold truncate">{name}</p>
        <p className="text-white/50 text-[9px] truncate">{tag}</p>
      </div>
    </div>
  );
}
