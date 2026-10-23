import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[60dvh] max-w-md place-items-center px-4">
      <div className="glass-strong w-full rounded-[28px] p-8 text-center">
        <h1 className="text-2xl font-semibold">Not here</h1>
        <p className="mt-2 text-ink-soft">This page was moved or never existed.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-nu-blue px-5 font-medium text-white">
          Back to the list
        </Link>
      </div>
    </main>
  );
}
