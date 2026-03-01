"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function changePassword(formData: FormData) {
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!password || password.length < 8) {
    return redirect("/profile?error=Password+must+be+at+least+8+characters");
  }
  if (password !== confirm) {
    return redirect("/profile?error=Passwords+do+not+match");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/profile?success=1");
}
