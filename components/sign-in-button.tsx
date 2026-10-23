"use client";

import { useState } from "react";

export function SignInButton({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    // loaded on click: most visitors never sign in, so the auth library stays out of the first page load
    const { createClient } = await import("@/lib/supabase/client");
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
