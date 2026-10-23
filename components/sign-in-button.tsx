"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignInButton({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={loading}
      className={
        compact
          ? "h-9 rounded-full bg-nu-blue px-4 text-sm font-medium text-white disabled:opacity-60"
          : "min-h-11 rounded-full bg-nu-blue px-5 font-medium text-white disabled:opacity-60"
      }
    >
      {loading ? "Opening Google..." : compact ? "Sign in" : "Sign in with Google"}
    </button>
  );
}
