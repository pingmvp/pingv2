"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface Props {
  eventId: string;
  redirectTo?: string;
  label?: string;
  size?: "default" | "sm" | "lg";
}

export function RunMatchingButton({ eventId, redirectTo, label, size = "lg" }: Props) {
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

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
      setState("error");
    }
  }

  return (
    <div className="space-y-3">
      <Button
        size={size}
        onClick={handleRun}
        disabled={state === "running"}
        className="gap-2"
      >
        <Zap className="w-4 h-4" />
        {state === "running" ? "Calculating…" : (label ?? "Run matching")}
      </Button>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
