import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy | OJT Hunter",
  description: "What OJT Hunter stores when you sign in, and who can see it.",
};

// Keep this page in sync with what the app actually stores.
export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-16 leading-7">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="text-zinc-600 dark:text-zinc-400">Last updated October 23, 2026</p>

      <p>
        OJT Hunter is a student project that helps NU Laguna students find OJT openings. You can
        browse without signing in.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">What we store when you sign in with Google</h2>
        <p>
          Your name, email address and profile picture from Google, so you can log in. We only ask
          Google for basic profile access. We never see your Google password, Gmail or Drive.
        </p>
        <p>
          Later features will let you save a private application tracker, profile and checklist.
          Those are only visible to you. Public pages never show who applied where.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Who handles the data</h2>
        <p>
          Accounts and data are stored with Supabase. The site is hosted on Vercel. We do not sell
          data, show ads or share it with employers.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Deleting your data</h2>
        <p>
          Ask the site owner to delete your account and everything linked to it, using the contact
          email shown on the Google sign-in screen.
        </p>
      </section>

      <Link href="/" className="min-h-11 font-medium underline underline-offset-4">
        Back to home
      </Link>
    </main>
  );
}
