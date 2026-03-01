import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { ChangePasswordForm } from "./change-password-form";
import { User, CalendarDays, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Props {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function ProfilePage({ searchParams }: Props) {
  const { error, success } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ value: eventCount }] = await db
    .select({ value: count() })
    .from(events)
    .where(eq(events.hostId, user!.id));

  const memberSince = user!.created_at
    ? new Date(user!.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account settings.</p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Email" value={user!.email ?? "—"} />
          <Row label="Member since" value={memberSince} icon={<CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />} />
          <Row label="Events created" value={String(eventCount)} />
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4" /> Change password
          </CardTitle>
          <CardDescription>Choose a strong password of at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <p className="text-sm text-emerald-600 font-medium">Password updated successfully.</p>
          )}
          {error && (
            <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
          )}
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
