"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works", sectionId: "how-it-works" },
  { label: "Features",     href: "#features",     sectionId: "features"     },
  { label: "Team",         href: "#about",        sectionId: "about"        },
  { label: "Contact",      href: "#contact",      sectionId: "contact"      },
];

export default function LandingHeader() {
  const [scrolled,       setScrolled]       = useState(false);
  const [activeSection,  setActiveSection]  = useState("");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);

      // Active section: whichever section's top has passed 55% of viewport height
      const mid = window.innerHeight * 0.55;
      let current = "";
      for (const link of NAV_LINKS) {
        const el = document.getElementById(link.sectionId);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= mid) current = link.sectionId;
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: "var(--color-cream)",
        borderBottom: `1px solid rgba(10,22,40,${scrolled ? "0.10" : "0.05"})`,
        boxShadow: scrolled ? "0 1px 8px rgba(10,22,40,0.06)" : "none",
      }}
    >
      {/* Slightly taller bar */}
      <div className="max-w-7xl mx-auto px-8 h-[78px] flex items-center justify-between">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div
            className="rounded-lg flex items-center justify-center"
            style={{ width: 32, height: 32, background: "var(--color-navy)" }}
          >
            <Zap style={{ width: 17, height: 17, color: "white" }} strokeWidth={2.5} />
          </div>
          <span className="font-bold tracking-tight" style={{ fontSize: 16, color: "var(--color-navy)" }}>
            Togly
          </span>
        </Link>

        {/* ── Nav links ── */}
        <nav className="hidden md:flex items-center" style={{ gap: 36 }}>
          {NAV_LINKS.map(link => {
            const active = activeSection === link.sectionId;
            return (
              <a
                key={link.label}
                href={link.href}
                className="font-medium no-underline transition-colors duration-150"
                style={{
                  fontSize: 15,
                  color: "var(--color-navy)",
                  opacity: active ? 1 : 0.48,
                  textDecoration: "none",
                  paddingBottom: 3,
                  borderBottom: active
                    ? "2px solid var(--color-accent-on-light)"
                    : "2px solid transparent",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = active ? "1" : "0.48")}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* ── Sign in ── */}
        <Link href="/login" className="shrink-0">
          <button
            className="rounded-full font-semibold transition-all duration-150"
            style={{
              height: 38, paddingLeft: 20, paddingRight: 20, fontSize: 14,
              background: "var(--color-navy)",
              color: "white",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.78")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Sign in
          </button>
        </Link>
      </div>
    </header>
  );
}
