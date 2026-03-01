"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "./actions";

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    await changePassword(formData);
    setPending(false);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Min 8 characters"
          required
          minLength={8}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          placeholder="Re-enter new password"
          required
        />
      </div>
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
