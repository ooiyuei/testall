import { getSupabase } from "./supabase";

const REDIRECT_BASE =
  typeof window !== "undefined" ? window.location.origin : "";

export async function signInWithGoogle(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${REDIRECT_BASE}/auth/callback`,
    },
  });
  if (error) throw error;
}

export async function signInWithMagicLink(email: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${REDIRECT_BASE}/auth/callback`,
    },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
}
