"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONTACT_EMAIL = "hello@thetogly.com";

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Togly inquiry from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  return (
    <section id="contact" className="bg-slate-950 border-y border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-start">
        {/* Left: heading */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Contact</p>
          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Ready to make your next event matter?
          </h2>
          <p className="text-white/45 text-lg leading-relaxed">
            Tell us about your event and we&apos;ll get back to you within 24 hours.
          </p>
          <p className="text-sm text-white/30">{CONTACT_EMAIL}</p>
        </div>

        {/* Right: form */}
        <div>
          {submitted ? (
            <div className="flex flex-col gap-4 py-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white">Message sent!</h3>
              <p className="text-sm text-white/50">
                Your mail client should have opened. We&apos;ll be in touch soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50" htmlFor="contact-name">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="contact-name"
                    required
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50" htmlFor="contact-email">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="jane@acme.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-white/50" htmlFor="contact-message">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  placeholder="Tell us about your event — size, type, goals…"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
                />
              </div>

              <Button type="submit" size="lg" className="w-full font-semibold shadow-lg shadow-primary/25">
                Send message
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
