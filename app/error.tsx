"use client";

import Link from "next/link";

// shown when a page fails to load (for example, the database is waking up)
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-[60dvh] max-w-md place-items-center px-4">
      <div className="glass-strong w-full rounded-[28px] p-8 text-center">
        <h1 className="text-2xl font-semibold">That didn&rsquo;t load</h1>
        <p className="mt-2 text-ink-soft">The data service may be waking up. Try again in a few seconds.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" onClick={reset} className="h-11 rounded-full bg-nu-blue px-5 font-medium text-white">
            Try again
          </button>
          <Link href="/" className="glass inline-flex h-11 items-center rounded-full px-5 font-medium">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
