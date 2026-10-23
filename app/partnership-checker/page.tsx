import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowUpRight, BadgeCheck, CircleHelp, Search } from "lucide-react";
import { Badge } from "@/components/badge";
import { CopyButton } from "@/components/copy-button";
import { getConfig, getResources, searchPartnership } from "@/lib/data";
import { partnerLabel, partnerTone } from "@/lib/labels";

export const metadata: Metadata = {
  title: "HTE checker",
  description: "Check if a company is on the NU Laguna HTE partner list.",
};

const EMPLOYER_QUESTION =
  "Do you require an existing MOA with our specific campus, or can you accommodate a new school partnership?";

export default function CheckerPage({ searchParams }: PageProps<"/partnership-checker">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-28 pt-6">
      <Suspense fallback={<div className="glass-strong h-48 animate-pulse rounded-[28px]" />}>
        <Checker searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={null}>
        <NextSteps />
      </Suspense>
    </main>
  );
}

async function Checker({ searchParams }: Pick<PageProps<"/partnership-checker">, "searchParams">) {
  await connection();
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").trim().slice(0, 80);
  const config = await getConfig();
  const result = q.length >= 2 ? await searchPartnership(q) : null;

  return (
    <>
      <section className="glass-strong rounded-[28px] p-5 sm:p-7">
        <h1 className="text-3xl font-semibold tracking-tight">HTE partner?</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {config.campus} list, {config.hte_list_version}
        </p>
        <form action="/partnership-checker" className="glass mt-5 flex h-12 items-center gap-2 rounded-full pl-4 pr-1">
          <Search className="size-4 shrink-0 text-ink-soft" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Brand or legal name"
            aria-label="Company name"
            autoComplete="off"
            className="w-full min-w-0 bg-transparent text-base outline-none placeholder:text-ink-soft"
          />
          <button type="submit" className="h-10 shrink-0 rounded-full bg-nu-blue px-4 text-sm font-medium text-white">
            Check
          </button>
        </form>
      </section>

      {result && (
        <section aria-live="polite" className="flex flex-col gap-3">
          {result.strong.length > 0 ? (
            <div className="rounded-[22px] bg-good/10 p-5">
              <p className="flex items-center gap-2 font-semibold text-good">
                <BadgeCheck className="size-5" /> On the list
              </p>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                {result.strong.map((e) => (
                  <li key={e.entry_no}>
                    <span className="tabular text-ink-soft">#{e.entry_no}</span> {e.name_as_listed}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-ink-soft">A name match does not prove the exact company or campus is covered. Confirm the legal name with your FIC.</p>
            </div>
          ) : result.similar.length > 0 ? (
            <div className="glass rounded-[22px] p-5">
              <p className="font-semibold">No exact match. Did you mean:</p>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                {result.similar.map((e) => (
                  <li key={e.entry_no}>
                    <Link href={`/partnership-checker?q=${encodeURIComponent(e.name_as_listed)}`} className="underline-offset-4 hover:underline">
                      <span className="tabular text-ink-soft">#{e.entry_no}</span> {e.name_as_listed}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="glass rounded-[22px] p-5">
              <p className="font-semibold">Not found in the {config.hte_list_version} list</p>
              <p className="mt-1 text-sm text-ink-soft">That does not mean there is no MOA. Try the legal name, then ask your FIC.</p>
            </div>
          )}

          {result.companies.map((c) => (
            <Link key={c.slug} href={`/companies/${c.slug}`} className="glass flex flex-col gap-2 rounded-[22px] p-5">
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold">{c.name}</span>
                <ArrowUpRight className="size-4 shrink-0 text-ink-soft" />
              </span>
              {c.legal_name && c.legal_name !== c.name && <span className="text-sm text-ink-soft">{c.legal_name}</span>}
              {c.partnership_status && (
                <span>
                  <Badge tone={partnerTone[c.partnership_status]}>{partnerLabel[c.partnership_status]}</Badge>
                </span>
              )}
              {c.notes && <span className="text-sm text-ink-soft">{c.notes}</span>}
            </Link>
          ))}

          {result.strong.length > 0 && result.similar.length > 0 && (
            <details className="glass rounded-[22px] p-5 text-sm">
              <summary className="cursor-pointer font-medium">Similar names ({result.similar.length})</summary>
              <ul className="mt-3 flex flex-col gap-1.5">
                {result.similar.map((e) => (
                  <li key={e.entry_no}>
                    <span className="tabular text-ink-soft">#{e.entry_no}</span> {e.name_as_listed}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
    </>
  );
}

async function NextSteps() {
  await connection();
  const resources = await getResources();
  return (
    <section className="glass rounded-[22px] p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <CircleHelp className="size-4 text-ink-soft" /> Not sure?
      </h2>
      <ul className="mt-4 flex flex-col gap-4 text-sm">
        <li>
          <p className="font-medium">Ask the employer early</p>
          <div className="mt-2 flex items-start gap-2">
            <p className="flex-1 text-ink-soft">&ldquo;{EMPLOYER_QUESTION}&rdquo;</p>
            <CopyButton value={EMPLOYER_QUESTION} label="Copy the question" />
          </div>
        </li>
        <li>
          <p className="font-medium">Check if a classmate already asked</p>
          <Link href="/moa-board" className="mt-1 inline-block text-nu-blue underline underline-offset-4 dark:text-nu-gold">
            MOA board
          </Link>
        </li>
        <li>
          <p className="font-medium">Ask your FIC to request a new MOA</p>
          <p className="mt-1 text-ink-soft">Use the MOA request form on MS Teams. No processing time is promised.</p>
        </li>
      </ul>
      {resources.length > 0 && (
        <ul className="mt-5 flex flex-col gap-2 border-t border-ink/10 pt-4">
          {resources.map((r) => (
            <li key={r.id}>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-between gap-3">
                <span>
                  <span className="block text-sm font-medium">{r.label}</span>
                  {r.detail && <span className="block text-xs text-ink-soft">{r.detail}</span>}
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-ink-soft" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
