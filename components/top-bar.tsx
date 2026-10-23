import Link from "next/link";
import { connection } from "next/server";
import { LogOut } from "lucide-react";
import { SignInButton } from "@/components/sign-in-button";
import { createClient } from "@/lib/supabase/server";

export async function TopBar() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  return (
    <header className="sticky top-0 z-30 px-4 pt-3">
      <nav className="glass mx-auto flex h-12 max-w-6xl items-center justify-between rounded-full pl-4 pr-1.5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="grid size-6 place-items-center rounded-lg bg-nu-blue text-[11px] font-bold text-nu-gold">
            OJT
          </span>
          Hunter
        </Link>
        {signedIn ? (
          <form action="/auth/signout" method="post">
            <button type="submit" aria-label="Sign out" className="grid size-9 place-items-center rounded-full text-ink-soft hover:bg-white/40">
              <LogOut className="size-4" />
            </button>
          </form>
        ) : (
          <SignInButton compact />
        )}
      </nav>
    </header>
  );
}
