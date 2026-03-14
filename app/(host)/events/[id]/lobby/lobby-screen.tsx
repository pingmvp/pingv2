"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

type Attendee = {
  id: string;
  name: string;
  createdAt: string | Date;
};

type LobbyData = {
  status: string;
  attendees: Attendee[];
};

interface Props {
  eventId: string;
  eventName: string;
  attendeeUrl: string;
  initial: LobbyData;
}

const BUBBLE_COLORS = [
  "bg-violet-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-orange-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-pink-500",
  "bg-cyan-500",
];

function bubbleColor(name: string) {
  let h = 0;
  for (const c of name) h += c.charCodeAt(0);
  return BUBBLE_COLORS[h % BUBBLE_COLORS.length];
}

export function LobbyScreen({ eventId, eventName, attendeeUrl, initial }: Props) {
  const router = useRouter();
  const [data, setData] = useState<LobbyData>(initial);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const knownIds = useRef(new Set(initial.attendees.map((a) => a.id)));
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/attendees`);
        if (!res.ok) return;
        const json: LobbyData = await res.json();

        const incoming = json.attendees.filter((a) => !knownIds.current.has(a.id));
        if (incoming.length > 0) {
          const highlighted = new Set(incoming.map((a) => a.id));
          setNewIds(highlighted);
          incoming.forEach((a) => knownIds.current.add(a.id));
          setTimeout(() => setNewIds(new Set()), 1800);

          // Scroll grid to bottom so new bubbles are visible
          requestAnimationFrame(() => {
            if (gridRef.current) {
              gridRef.current.scrollTop = gridRef.current.scrollHeight;
            }
          });
        }

        setData(json);
      } catch {
        // silently retry
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [eventId]);

  const count = data.attendees.length;
  const mostRecent = [...data.attendees].at(-1);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col select-none">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-slate-950" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight truncate max-w-lg">
            {eventName}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Exit presentation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-stretch gap-0 min-h-0">
        {/* Left: QR code panel */}
        <div className="w-80 xl:w-96 flex flex-col items-center justify-center gap-6 px-8 py-8 border-r border-white/10 shrink-0">
          <div className="bg-white p-5 rounded-2xl shadow-2xl">
            <QRCode value={attendeeUrl} size={220} />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-white/70 text-base font-semibold">Scan to join</p>
            <p className="text-white/35 text-xs font-mono break-all">{attendeeUrl}</p>
          </div>
        </div>

        {/* Right: counter + bubbles */}
        <div className="flex-1 flex flex-col gap-6 px-8 py-8 min-w-0">
          {/* Counter */}
          <div className="flex items-baseline gap-4 shrink-0">
            <span className="text-8xl font-black tabular-nums leading-none">
              {count}
            </span>
            <div>
              <p className="text-3xl font-bold text-white/80 leading-tight">
                {count === 1 ? "person" : "people"}
              </p>
              <p className="text-base text-white/40 mt-1">
                {count === 0 ? "waiting to join" : "joined"}
              </p>
            </div>
          </div>

          {/* Attendee bubble grid */}
          {count === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="flex justify-center gap-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-16 h-10 rounded-xl bg-white/5 border border-white/10"
                      style={{ animationDelay: `${i * 200}ms` }}
                    />
                  ))}
                </div>
                <p className="text-white/25 text-xl font-medium">
                  Waiting for attendees to scan...
                </p>
              </div>
            </div>
          ) : (
            <div
              ref={gridRef}
              className="flex-1 overflow-y-auto overflow-x-hidden"
              style={{ scrollbarWidth: "none" }}
            >
              <div className="flex flex-wrap gap-2.5 content-start">
                {data.attendees.map((a) => {
                  const isNew = newIds.has(a.id);
                  return (
                    <div
                      key={a.id}
                      className={[
                        "flex items-center gap-2 pl-2.5 pr-4 py-2 rounded-xl font-semibold text-sm text-white transition-all duration-300",
                        bubbleColor(a.name),
                        isNew
                          ? "scale-110 ring-2 ring-white/60 shadow-lg shadow-white/10"
                          : "scale-100",
                      ].join(" ")}
                    >
                      <span className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center text-xs font-bold shrink-0">
                        {a.name.charAt(0).toUpperCase()}
                      </span>
                      {a.name.split(" ")[0]}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────── */}
      <div className="px-8 py-3.5 border-t border-white/10 shrink-0 flex items-center gap-3 min-h-[52px]">
        {mostRecent ? (
          <>
            <span className="text-white/35 text-sm">Last joined:</span>
            <span className="text-white text-sm font-semibold">{mostRecent.name}</span>
          </>
        ) : (
          <span className="text-white/25 text-sm">
            Share the QR code or link to get responses
          </span>
        )}
      </div>
    </div>
  );
}
