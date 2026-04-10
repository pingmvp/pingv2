import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Users,
  BarChart3,
  Sparkles,
  QrCode,
  SlidersHorizontal,
  ArrowRight,
  Check,
  Clock,
} from "lucide-react";
import LiveFeed from "./live-feed";
import HowItWorksSection from "./how-it-works-section";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-bold tracking-tight text-white">Ping</span>
          </div>
          <Link href="/login">
            <Button
              size="sm"
              className="border border-white/20 text-white/80 hover:text-white hover:bg-white/10 bg-transparent shadow-none"
            >
              Sign in
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative bg-slate-950 overflow-hidden pt-14">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff0a 1px, transparent 1px), linear-gradient(to bottom, #ffffff0a 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-28 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-medium text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Built for event hosts
            </div>

            <h1 className="text-5xl lg:text-[3.75rem] font-extrabold tracking-tight leading-[1.05]">
              Every attendee deserves a{" "}
              <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
                great connection
              </span>
            </h1>

            <p className="text-lg text-white/55 leading-relaxed max-w-lg">
              Ping lets event hosts create a custom questionnaire, collect
              responses, and run a compatibility matching engine — all from one
              dashboard. Attendees just need a link.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/login">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/25 font-semibold">
                  <Zap className="w-4 h-4" />
                  Get started free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-col gap-2.5 text-sm text-white/40 pt-1">
              {[
                "No app required for attendees",
                "Weighted compatibility scoring across custom questions",
                "Results visible in your dashboard instantly",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <LiveFeed />
        </div>
      </section>

      <section className="border-y bg-muted/40">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-3 gap-8">
          {[
            { value: "3–10", label: "Custom questions per event" },
            { value: "1–5+", label: "Matches per attendee" },
            { value: "< 5 min", label: "Setup time for hosts" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center space-y-1">
              <p className="text-2xl font-extrabold tracking-tight">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <HowItWorksSection />

      <section className="bg-muted/30 border-y">
        <div className="max-w-6xl mx-auto px-6 py-24 space-y-12">
          <div className="text-center space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Features</p>
            <h2 className="text-4xl font-extrabold tracking-tight">Everything hosts need</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Purpose-built for event hosts who want measurable networking outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
            <div className="lg:col-span-2 lg:row-span-2 rounded-2xl border bg-card p-8 space-y-4 hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center mb-5">
                  <Sparkles className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Smart matching engine</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every attendee pair gets a compatibility score built from
                  weighted answers across your custom questions. Single choice,
                  multi-select, and scale question types are all supported.
                  You control which questions matter most.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-4">
                {["Single choice", "Multi-select", "Scale (1–10)"].map((type) => (
                  <div
                    key={type}
                    className="rounded-xl bg-muted/60 border px-3 py-2 text-center"
                  >
                    <p className="text-xs font-semibold">{type}</p>
                  </div>
                ))}
              </div>
            </div>

            {[
              {
                icon: Users,
                title: "Two-sided matching",
                desc: "Match investors with founders, mentors with mentees, or any two groups.",
                color: "bg-emerald-50 text-emerald-600",
              },
              {
                icon: SlidersHorizontal,
                title: "Custom question weights",
                desc: "Dial in which questions influence the score most — from 1 to 10.",
                color: "bg-sky-50 text-sky-600",
              },
              {
                icon: BarChart3,
                title: "Live response tracking",
                desc: "See responses arrive in real time from your event dashboard.",
                color: "bg-rose-50 text-rose-600",
              },
              {
                icon: QrCode,
                title: "Link & QR code access",
                desc: "One shareable URL. Display a QR code at your venue for instant access.",
                color: "bg-amber-50 text-amber-600",
              },
              {
                icon: Clock,
                title: "5-minute setup",
                desc: "Start from an event template and go live faster than writing name tags.",
                color: "bg-indigo-50 text-indigo-600",
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="rounded-2xl border bg-card p-5 space-y-3 hover:shadow-md transition-shadow duration-300"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-slate-950 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff08 1px, transparent 1px), linear-gradient(to bottom, #ffffff08 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-6 py-28 text-center space-y-7">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Zap className="w-7 h-7 text-primary" strokeWidth={2} />
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Ready to run your first matched event?
          </h2>
          <p className="text-white/50 max-w-sm mx-auto">
            Set up an event in minutes. No credit card required.
          </p>
          <Link href="/login">
            <Button size="lg" className="gap-2 shadow-xl shadow-primary/30 font-semibold">
              <Zap className="w-4 h-4" />
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t bg-slate-950">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between text-xs text-white/30">
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
