"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

type Match = {
  id: string;
  partnerName: string;
  rank: number;
  score: number;
};

type MatchesData = {
  status: "waiting" | "ready";
  eventName: string;
  attendeeName: string;
  matchCount: number;
  matches: Match[];
};

interface Props {
  token: string;
  initial: MatchesData;
}

export function MatchesPoller({ token, initial }: Props) {
  const [data, setData] = useState<MatchesData>(initial);

  useEffect(() => {
    if (data.status === "ready") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/e/${token}/matches`);
        if (!res.ok) return;
        const json: MatchesData = await res.json();
        setData(json);
        if (json.status === "ready") clearInterval(interval);
      } catch {
        // silently retry
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token, data.status]);

  const firstName = data.attendeeName.split(" ")[0];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      {/* Branding */}
      <div className="absolute top-5 left-6 flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-background" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-bold tracking-tight">Ping</span>
      </div>

      <div className="w-full max-w-sm space-y-8">
        {data.status === "ready" ? (
          <>
            {/* Ready state */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center">
                  <Zap className="w-10 h-10 text-emerald-600" strokeWidth={2} />
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Your matches are ready, {firstName}!
              </h1>
              <p className="text-muted-foreground">
                Find them at{" "}
                <span className="font-semibold text-foreground">{data.eventName}</span>{" "}
                and make the connection.
              </p>
            </div>

            <div className="space-y-3">
              {data.matches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-xl border bg-card px-5 py-4 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Match #{match.rank}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600">
                      {Math.round(match.score * 100)}% match
                    </span>
                  </div>
                  <p className="text-lg font-semibold">{match.partnerName}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Waiting state */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
                  <Zap className="w-10 h-10 text-muted-foreground animate-pulse" strokeWidth={2} />
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                You&apos;re in, {firstName}!
              </h1>
              {data.eventName && (
                <p className="text-muted-foreground leading-relaxed">
                  You&apos;re registered for{" "}
                  <span className="font-semibold text-foreground">{data.eventName}</span>.
                </p>
              )}
              <p className="text-muted-foreground leading-relaxed">
                Your top{" "}
                <span className="font-semibold text-foreground">
                  {data.matchCount} {data.matchCount === 1 ? "match" : "matches"}
                </span>{" "}
                will appear here when the event starts. Keep this page open.
              </p>
            </div>

            <div className="rounded-xl border bg-muted/40 px-5 py-4 text-sm text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground text-sm">What happens next?</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-bold shrink-0">1.</span>
                  We run the matching algorithm before the event.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-bold shrink-0">2.</span>
                  Your matches will appear on this page automatically.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-bold shrink-0">3.</span>
                  Find them at the event and make the connection.
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
