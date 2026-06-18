"use client";

import { ExternalLink } from "lucide-react";

const team = [
  {
    name: "Joshua Lustig",
    title: "Co-Founder",
    school: "Northeastern University",
    major: "Game Design & Business Administration",
    bio: "Josh leads product, marketing, GTM strategy, and business operations for Togly. He brings a rare blend of product thinking and business execution.",
    linkedin: "https://www.linkedin.com/in/jelustig",
    initials: "JL",
  },
  {
    name: "Sabit Islam",
    title: "Co-Founder",
    school: "University of Michigan",
    major: "Computer Science & Data Science",
    bio: "Sabit is the technical architect behind Togly — driving full-stack engineering and all infrastructure that powers the matching platform.",
    linkedin: "https://www.linkedin.com/in/sabit-islam/",
    initials: "SI",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="border-y border-black/8 bg-background">
      <div className="max-w-6xl mx-auto px-8 py-24 space-y-16">
        <div className="space-y-4 max-w-xl">
          {/* Accent eyebrow */}
          <p className="text-[12px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--color-accent-on-light)" }}>
            Team
          </p>
          <h2
            className="text-[44px] tracking-[-0.02em] text-foreground leading-tight"
            style={{ fontWeight: "var(--font-weight-hero)" }}
          >
            Built by people who&apos;ve been in the room.
          </h2>
          <p className="text-[18px] text-muted-foreground leading-relaxed">
            Togly started with a simple frustration: why do so many networking events feel like a
            waste of time? We believe in-person connection is irreplaceable — it just needs a smarter layer on top.
          </p>
        </div>

        {/* Team cards — dark navy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {team.map((member) => (
            <div
              key={member.name}
              className="rounded-2xl p-8 space-y-5"
              style={{
                background: "var(--color-navy)",
                border: "1px solid var(--color-navy-mid)",
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <span className="text-lg font-bold" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {member.initials}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-[18px] font-semibold text-white">{member.name}</h3>
                <p className="text-sm font-medium" style={{ color: "var(--color-accent)" }}>{member.title}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
                  {member.school} · {member.major}
                </p>
              </div>
              <p className="text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.58)" }}>
                {member.bio}
              </p>
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors duration-150"
                style={{ color: "rgba(255,255,255,0.38)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}
              >
                <ExternalLink className="w-3 h-3" />
                LinkedIn
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
