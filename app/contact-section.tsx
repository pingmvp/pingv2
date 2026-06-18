"use client";

import { useState } from "react";
import { CheckCircle, Mail } from "lucide-react";

const CONTACT_EMAIL = "hello@thetogly.com";

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Togly inquiry from ${form.name}`);
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  const inputClass = "w-full h-12 rounded-xl bg-input border border-black/10 px-4 text-[15px] text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/8 transition-all";

  return (
    <section id="contact" className="border-y border-black/8 bg-card">
      <div className="max-w-6xl mx-auto px-8 py-24 grid lg:grid-cols-2 gap-16 items-start">

        {/* Left — dark navy callout block */}
        <div className="space-y-6">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] mb-3" style={{ color: "var(--color-accent-on-light)" }}>
              Contact
            </p>
            <h2
              className="text-[44px] tracking-[-0.02em] text-foreground leading-tight"
              style={{ fontWeight: "var(--font-weight-hero)" }}
            >
              Ready to make your next event matter?
            </h2>
          </div>
          <p className="text-[18px] text-muted-foreground leading-relaxed">
            Tell us about your event and we&apos;ll get back to you within 24 hours.
          </p>

          {/* Dark navy contact card */}
          <div
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{
              background: "var(--color-navy)",
              border: "1px solid var(--color-navy-mid)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--color-accent)" }}
            >
              <Mail className="w-5 h-5" style={{ color: "var(--color-navy)" }} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>
                Email us directly
              </p>
              <p className="text-sm font-medium text-white">{CONTACT_EMAIL}</p>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div>
          {submitted ? (
            <div className="flex flex-col gap-4 py-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Message sent!</h3>
              <p className="text-sm text-muted-foreground">Your mail client should have opened. We&apos;ll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="contact-name">Name *</label>
                  <input id="contact-name" required placeholder="Jane Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="contact-email">Email *</label>
                  <input id="contact-email" type="email" required placeholder="jane@acme.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="contact-message">Message</label>
                <textarea id="contact-message" rows={5} placeholder="Tell us about your event — size, type, goals…" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full rounded-xl bg-input border border-black/10 px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/8 transition-all resize-none" />
              </div>
              <button
                type="submit"
                className="w-full h-[52px] rounded-full text-white text-base font-semibold hover:opacity-80 transition-all duration-150 active:scale-[0.97]"
                style={{ background: "var(--color-navy)" }}
              >
                Send message
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
