import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What OJT Hunter stores when you sign in, and who can see it.",
};

// Keep this page in sync with what the app actually stores.
export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-28 pt-10 leading-7">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="text-ink-soft">Last updated October 23, 2026 (analytics added)</p>

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
          Your profile, application tracker and deployment checklist are private. Only you can see them,
          admins included. Public pages never show who applied where.
        </p>
        <p>
          When you share an update or answer &ldquo;Still open?&rdquo;, admins see what you sent so they can
          review it. Other students only see the result and the date, never your name.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Who handles the data</h2>
        <p>
          Accounts and data are stored with Supabase. The site is hosted on Vercel. We do not sell
          data, show ads or share it with employers.
        </p>
        <p>
          Vercel Web Analytics counts page visits without cookies and without identifying you, so we can
          see which pages are useful. It never records what you type or your tracker.
        </p>
        <p>Your browser keeps a sign-in cookie so you stay logged in. Nothing else is stored for tracking.</p>
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
