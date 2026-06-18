"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { Zap, LayoutDashboard, User, ChevronLeft, LogOut } from "lucide-react";

interface Props {
  userEmail: string;
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Events" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function Sidebar({ userEmail }: Props) {
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname?.startsWith("/events");
    }
    return pathname === href;
  }

  return (
    <div
      className="relative flex flex-col h-screen bg-card border-r border-black/8 shrink-0 transition-all duration-[250ms] ease-out overflow-visible"
      style={{ width: expanded ? 240 : 60 }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-black/8 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center shrink-0">
            <Zap className="w-[15px] h-[15px] text-background" strokeWidth={2.5} />
          </div>
          {expanded && (
            <span className="text-sm font-bold tracking-tight text-foreground whitespace-nowrap">
              Togly
            </span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={!expanded ? label : undefined}
              className={`relative flex items-center gap-2.5 h-10 rounded-lg transition-all duration-150 ${
                expanded ? "px-3" : "justify-center"
              } ${
                active
                  ? "bg-black/8 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-black/4 hover:text-foreground"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
              )}
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={active ? 2 : 1.5} />
              {expanded && <span className="text-sm">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-black/8 space-y-0.5 shrink-0">
        {expanded && (
          <p className="text-xs text-muted-foreground truncate px-3 py-1.5">{userEmail}</p>
        )}
        <form action={signOut}>
          <button
            type="submit"
            title={!expanded ? "Sign out" : undefined}
            className={`flex items-center gap-2.5 h-10 rounded-lg w-full text-muted-foreground hover:bg-black/4 hover:text-foreground transition-all duration-150 ${
              expanded ? "px-3" : "justify-center"
            }`}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={1.5} />
            {expanded && <span className="text-sm">Sign out</span>}
          </button>
        </form>
      </div>

      {/* Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md bg-card border border-black/10 flex items-center justify-center hover:bg-secondary transition-colors z-10 shadow-sm"
      >
        <ChevronLeft
          className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-[250ms]"
          style={{ transform: expanded ? "rotate(0deg)" : "rotate(180deg)" }}
        />
      </button>
    </div>
  );
}
