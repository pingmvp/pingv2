import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

interface Props {
  searchParams: Promise<{ sent?: string; email?: string; error?: string; tab?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  // Redirect already-authenticated hosts straight to dashboard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / heading */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Ping</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your events
          </p>
        </div>

        {/* Sent confirmation */}
        {params.sent ? (
          <div className="rounded-lg border bg-card p-6 text-center space-y-2">
            <p className="font-medium">Check your email</p>
            <p className="text-sm text-muted-foreground">
              We sent a sign-in link to{" "}
              <span className="font-medium text-foreground">{params.email}</span>
              . Click it to continue.
            </p>
          </div>
        ) : (
          <LoginForm error={params.error} defaultTab={params.tab ?? "password"} />
        )}
      </div>
    </div>
  );
}
