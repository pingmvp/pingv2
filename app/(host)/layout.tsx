import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
                <Zap className="w-4 h-4 text-background" strokeWidth={2.5} />
              </div>
              <span className="font-bold tracking-tight">Ping</span>
            </Link>
            <nav>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
              >
                Events
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="text-sm text-muted-foreground hidden md:block truncate max-w-[200px] hover:text-foreground transition-colors"
            >
              {user.email}
            </Link>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
