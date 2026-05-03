"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "border-b border-white/10 bg-slate-950/90 backdrop-blur-md"
          : "border-b border-transparent bg-slate-950/80 backdrop-blur-md"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-8">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-bold tracking-tight text-white">Togly</span>
        </div>

        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-white/50 hover:text-white transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Link href="/login" className="ml-auto">
          <Button
            size="sm"
            className="border border-white/20 text-white/80 hover:text-white hover:bg-white/10 bg-transparent shadow-none"
          >
            Sign in
          </Button>
        </Link>
      </div>
    </header>
  );
}
