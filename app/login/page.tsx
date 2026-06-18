import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";
import { Zap } from "lucide-react";

interface Props {
  searchParams: Promise<{ sent?: string; email?: string; error?: string; tab?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-texture pointer-events-none" />

      <div className="relative w-full max-w-sm space-y-7">
        <div className="text-center space-y-3">
          <div className="w-11 h-11 rounded-xl bg-foreground flex items-center justify-center mx-auto">
            <Zap className="w-5 h-5 text-background" strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Togly</h1>
            <p className="text-sm text-muted-foreground">Sign in to manage your events</p>
          </div>
        </div>

        {params.sent ? (
          <div className="rounded-2xl border border-black/8 bg-card p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
              <Zap className="w-5 h-5 text-emerald-600" strokeWidth={2} />
            </div>
            <p className="font-semibold text-foreground">Check your email</p>
            <p className="text-sm text-muted-foreground">
              We sent a sign-in link to{" "}
              <span className="font-medium text-foreground">{params.email}</span>.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-black/8 bg-card p-6">
            <LoginForm error={params.error} defaultTab={params.tab ?? "password"} />
          </div>
        )}
      </div>
    </div>
  );
}
