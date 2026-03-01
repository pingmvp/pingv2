"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface Props {
  eventId: string;
}

export function RunMatchingButton({ eventId }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "running" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setState("running");
    setError(null);

    try {
      const res = await fetch(`/api/events/${eventId}/match`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setState("error");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setState("error");
    }
  }

  return (
    <div className="space-y-3">
      <Button
        size="lg"
        onClick={handleRun}
        disabled={state === "running"}
        className="gap-2"
      >
        <Zap className="w-4 h-4" />
        {state === "running" ? "Calculating matches…" : "Run matching"}
      </Button>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
