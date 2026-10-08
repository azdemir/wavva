"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type AuthResult = { error?: string };

const NOT_CONFIGURED_ERROR =
  "Sign-in isn't set up on this server yet — add your Supabase keys to .env.local and restart.";

export async function signUp(formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) return { error: error.message };
  // If email confirmation is enabled, there is no session yet.
  if (!data.session) {
    return {
      error:
        "Check your email to confirm your account, then sign in. (Tip: disable email confirmations in Supabase Auth settings for local development.)",
    };
  }
  redirect("/onboarding");
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: error.message };

  // Honor an explicit redirect (e.g. an invite link); otherwise the
  // dashboard layout routes based on onboarding state.
  const next = formData.get("next");
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/signin");
}
