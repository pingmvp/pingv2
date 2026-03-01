"use client";

import { useState } from "react";
import { signInWithMagicLink, signInWithPassword, signUpWithPassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  error?: string;
  defaultTab?: string;
}

export function LoginForm({ error, defaultTab = "password" }: Props) {
  const [passwordMode, setPasswordMode] = useState<"signin" | "signup">("signin");

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <TabsList className="w-full">
        <TabsTrigger value="password" className="flex-1">Password</TabsTrigger>
        <TabsTrigger value="magic" className="flex-1">Magic Link</TabsTrigger>
      </TabsList>

      {/* ── Magic Link ── */}
      <TabsContent value="magic">
        <form action={signInWithMagicLink} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="magic-email">Email address</Label>
            <Input
              id="magic-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          {defaultTab === "magic" && error && (
            <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
          )}

          <Button type="submit" className="w-full">
            Send sign-in link
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            We&apos;ll email you a one-click sign-in link.
          </p>
        </form>
      </TabsContent>

      {/* ── Email + Password ── */}
      <TabsContent value="password">
        <form
          action={passwordMode === "signin" ? signInWithPassword : signUpWithPassword}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="pw-email">Email address</Label>
            <Input
              id="pw-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pw-password">Password</Label>
            <Input
              id="pw-password"
              name="password"
              type="password"
              placeholder={passwordMode === "signup" ? "Min. 6 characters" : "••••••••"}
              required
              autoComplete={passwordMode === "signin" ? "current-password" : "new-password"}
            />
          </div>

          {defaultTab === "password" && error && (
            <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>
          )}

          <Button type="submit" className="w-full">
            {passwordMode === "signin" ? "Sign in" : "Create account"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            {passwordMode === "signin" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  onClick={() => setPasswordMode("signup")}
                  className="underline underline-offset-2 text-foreground"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setPasswordMode("signin")}
                  className="underline underline-offset-2 text-foreground"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </TabsContent>
    </Tabs>
  );
}
