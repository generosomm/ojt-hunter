import Link from "next/link";
import { connection } from "next/server";
import { Inbox, LogOut, MessageSquarePlus } from "lucide-react";
import { SignInButton } from "@/components/sign-in-button";
import { currentUser } from "@/lib/me";

export async function TopBar() {
  await connection();
  // shared with the page: one auth check per request
  const { supabase, userId } = await currentUser();

  // admins see how many submissions wait for review
  let pending: number | null = null;
  if (userId) {
    const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
    if (admin) {
      const { count } = await supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "pending");
      pending = count ?? 0;
    }
  }

  return (
    <header className="sticky top-0 z-30 px-4 pt-3">
      <nav className="glass mx-auto flex h-12 max-w-6xl items-center justify-between rounded-full pl-4 pr-1.5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="grid size-6 place-items-center rounded-lg bg-nu-blue text-[11px] font-bold text-nu-gold">
            OJT
          </span>
          Hunter
        </Link>
        {userId ? (
          <div className="flex items-center gap-0.5">
            <Link href="/submit" className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-ink-soft hover:bg-white/40 hover:text-ink">
              <MessageSquarePlus className="size-4" />
              <span className="hidden sm:inline">Share an update</span>
              <span className="sm:hidden">Share</span>
            </Link>
            {pending !== null && (
              <Link href="/admin" aria-label={`Review queue, ${pending} waiting`} className="relative grid size-9 place-items-center rounded-full text-ink-soft hover:bg-white/40">
                <Inbox className="size-4" />
                {pending > 0 && (
                  <span className="tabular absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-nu-gold px-1 text-[10px] font-semibold text-ink">
                    {pending}
                  </span>
                )}
              </Link>
            )}
            <form action="/auth/signout" method="post">
              <button type="submit" aria-label="Sign out" className="grid size-9 place-items-center rounded-full text-ink-soft hover:bg-white/40">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        ) : (
          <SignInButton compact />
        )}
      </nav>
    </header>
  );
}
