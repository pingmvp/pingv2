import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Zap,
  Users,
  BarChart3,
  Sparkles,
  QrCode,
  SlidersHorizontal,
  ArrowRight,
  Clock,
} from "lucide-react";
import HowItWorksSection from "./how-it-works-section";
import LandingHeader from "./landing-header";
import GlobeSection from "./globe-section";
import AboutSection from "./about-section";
import ContactSection from "./contact-section";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen text-foreground">
      <LandingHeader />

      {/* ── Globe hero ───────────────────────────────────────── */}
      <GlobeSection />

      {/* ── Rest of landing (ecru/tan palette) ───────────────── */}
      <div className="bg-background">
        {/* ── How it works ───────────────────────────────────── */}
        <div id="how-it-works">
          <HowItWorksSection />
        </div>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="border-y border-black/8 bg-card">
        <div className="max-w-6xl mx-auto px-8 py-24 space-y-16">
          <div className="space-y-4">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--color-accent-on-light)" }}>
              Features
            </p>
            <h2 className="text-[44px] tracking-[-0.02em] text-foreground" style={{ fontWeight: "var(--font-weight-hero)" }}>
              Everything hosts need
            </h2>
            <p className="text-[18px] text-muted-foreground max-w-[520px] leading-relaxed">
              Purpose-built for event hosts who want measurable networking outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              className="lg:col-span-2 rounded-2xl border p-8 space-y-6 flex flex-col justify-between transition-opacity duration-200 hover:opacity-95"
              style={{ background: "var(--color-navy)", borderColor: "var(--color-navy-mid)" }}
            >
              <div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: "var(--color-accent)" }}>
                  <Sparkles className="w-5 h-5" style={{ color: "var(--color-navy)" }} strokeWidth={1.5} />
                </div>
                <h3 className="text-[20px] font-semibold text-white mb-2">Smart matching engine</h3>
                <p className="text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.58)" }}>
                  Every attendee pair gets a compatibility score built from weighted answers
                  across your custom questions. You control which questions matter most.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {["Single choice", "Multi-select", "Scale (1–10)"].map((type) => (
                  <div key={type} className="rounded-xl px-3 py-2.5 text-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                    <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>{type}</p>
                  </div>
                ))}
              </div>
            </div>

            {[
              { icon: Users, title: "Two-sided matching", desc: "Match investors with founders, mentors with mentees, or any two groups." },
              { icon: SlidersHorizontal, title: "Custom question weights", desc: "Dial in which questions influence the score most — from 1 to 10." },
              { icon: BarChart3, title: "Live response tracking", desc: "See responses arrive in real time from your event dashboard." },
              { icon: QrCode, title: "Link & QR code access", desc: "One shareable URL. Display a QR code at your venue for instant access." },
              { icon: Clock, title: "5-minute setup", desc: "Start from an event template and go live faster than writing name tags." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-black/8 bg-background p-6 space-y-4 hover:border-black/16 transition-colors duration-200">
                <div className="w-11 h-11 rounded-xl bg-foreground flex items-center justify-center">
                  <Icon className="w-5 h-5 text-background" strokeWidth={1.5} />
                </div>
                <h3 className="text-[17px] font-semibold text-foreground">{title}</h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AboutSection />
      <ContactSection />

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="border-t border-black/8">
        <div className="max-w-6xl mx-auto px-8 py-24">
          <div className="rounded-3xl bg-foreground p-16 text-center space-y-7">
            <div className="w-12 h-12 rounded-2xl bg-background/15 border border-background/20 flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6 text-background" strokeWidth={2} />
            </div>
            <h2 className="text-[40px] font-bold tracking-[-0.02em] text-background leading-tight">
              Ready to run your first matched event?
            </h2>
            <p className="text-[18px] text-background/60 max-w-sm mx-auto">
              Set up an event in minutes. No credit card required.
            </p>
            <Link href="/login">
              <button className="inline-flex items-center gap-2 h-[52px] px-7 rounded-full bg-background text-foreground text-[15px] font-semibold hover:opacity-90 transition-all duration-150 active:scale-[0.97]">
                <Zap className="w-[17px] h-[17px]" strokeWidth={2.5} />
                Get started free
                <ArrowRight className="w-[17px] h-[17px]" />
              </button>
            </Link>
          </div>
        </div>
      </section>

        {/* ── Footer ─────────────────────────────────────────── */}
        <footer className="border-t border-black/8">
          <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3" strokeWidth={2.5} />
              <span className="font-bold text-foreground">Togly</span>
            </div>
            <span>© {new Date().getFullYear()} Togly. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
