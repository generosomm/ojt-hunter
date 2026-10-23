import { Suspense } from "react";
import { SignInButton } from "@/components/sign-in-button";
import { createClient } from "@/lib/supabase/server";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">OJT Hunter</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Setup check. The directory is coming soon.
        </p>
      </div>

      {/* The session is read per request, so it streams in after the static shell. */}
      <Suspense fallback={<p className="min-h-11 text-zinc-500">Checking sign-in...</p>}>
        <AuthStatus searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AuthStatus({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { auth_error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;

  return (
    <>
      {auth_error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          Sign-in did not finish. Try again.
        </p>
      )}

      {email ? (
        <div className="flex flex-col gap-4">
          <p>
            Signed in as <span className="font-medium">{email}</span>
          </p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="min-h-11 rounded-full border border-zinc-300 px-5 font-medium dark:border-zinc-700"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : (
        <div>
          <SignInButton />
        </div>
      )}
    </>
  );
}
