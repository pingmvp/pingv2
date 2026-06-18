"use client";

import { useState } from "react";
import { signInWithMagicLink, signInWithPassword, signUpWithPassword } from "./actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  error?: string;
  defaultTab?: string;
}

export function LoginForm({ error, defaultTab = "password" }: Props) {
  const [passwordMode, setPasswordMode] = useState<"signin" | "signup">("signin");

  const inputClass =
    "w-full h-12 rounded-xl bg-input border border-black/10 px-4 text-[15px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/8 transition-all";

  return (
    <Tabs defaultValue={defaultTab} className="space-y-5">
      <TabsList className="w-full bg-black/5 border border-black/8 p-1 rounded-xl h-10">
        <TabsTrigger
          value="password"
          className="flex-1 rounded-lg text-sm font-medium text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
        >
          Password
        </TabsTrigger>
        <TabsTrigger
          value="magic"
          className="flex-1 rounded-lg text-sm font-medium text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
        >
          Magic Link
        </TabsTrigger>
      </TabsList>

      <TabsContent value="magic">
        <form action={signInWithMagicLink} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="magic-email" className="text-xs font-semibold text-muted-foreground">
              Email address
            </label>
            <input id="magic-email" name="email" type="email" placeholder="you@example.com" required autoFocus autoComplete="email" className={inputClass} />
          </div>
          {defaultTab === "magic" && error && (
            <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
          )}
          <button type="submit" className="w-full h-[52px] rounded-full bg-foreground text-background text-base font-semibold hover:opacity-80 transition-all duration-150 active:scale-[0.97]">
            Send sign-in link
          </button>
          <p className="text-xs text-center text-muted-foreground">We&apos;ll email you a one-click sign-in link.</p>
        </form>
      </TabsContent>

      <TabsContent value="password">
        <form action={passwordMode === "signin" ? signInWithPassword : signUpWithPassword} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="pw-email" className="text-xs font-semibold text-muted-foreground">Email address</label>
            <input id="pw-email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="pw-password" className="text-xs font-semibold text-muted-foreground">Password</label>
            <input id="pw-password" name="password" type="password" placeholder={passwordMode === "signup" ? "Min. 6 characters" : "••••••••"} required autoComplete={passwordMode === "signin" ? "current-password" : "new-password"} className={inputClass} />
          </div>
          {defaultTab === "password" && error && (
            <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
          )}
          <button type="submit" className="w-full h-[52px] rounded-full bg-foreground text-background text-base font-semibold hover:opacity-80 transition-all duration-150 active:scale-[0.97]">
            {passwordMode === "signin" ? "Sign in" : "Create account"}
          </button>
          <p className="text-xs text-center text-muted-foreground">
            {passwordMode === "signin" ? (
              <>No account?{" "}<button type="button" onClick={() => setPasswordMode("signup")} className="text-foreground font-semibold hover:opacity-70 transition-opacity">Create one</button></>
            ) : (
              <>Already have an account?{" "}<button type="button" onClick={() => setPasswordMode("signin")} className="text-foreground font-semibold hover:opacity-70 transition-opacity">Sign in</button></>
            )}
          </p>
        </form>
      </TabsContent>
    </Tabs>
  );
}
