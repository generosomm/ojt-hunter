import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowUpRight, BadgeCheck, Ban, Mail } from "lucide-react";
import { Badge } from "@/components/badge";
import { CopyButton } from "@/components/copy-button";
import { OpportunityCard } from "@/components/opportunity-card";
import { PublishToggle } from "@/components/publish-toggle";
import { getCompany, getViewer } from "@/lib/data";
import { dateText } from "@/lib/format";
import { partnerLabel, partnerTone } from "@/lib/labels";
import type { Contact } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/companies/[slug]">): Promise<Metadata> {
  await connection();
  const data = await getCompany((await params).slug);
  return { title: data?.company.name ?? "Company not found" };
}

export default function CompanyPage({ params }: PageProps<"/companies/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6">
      <Suspense fallback={<div className="glass h-80 animate-pulse rounded-[28px]" />}>
        <CompanyView params={params} />
      </Suspense>
    </main>
  );
}

const usable = (c: Contact) => c.status === "reply_received" || c.status === "published_untested";
const purposeText: Record<Contact["purpose"], string> = {
  resume_intake: "Takes resumes",
  questions_only: "Questions only",
  help_desk: "Help desk",
  unknown: "Purpose unclear",
};

async function CompanyView({ params }: Pick<PageProps<"/companies/[slug]">, "params">) {
  await connection();
  const data = await getCompany((await params).slug);
  if (!data) notFound();
  const { company, config, partnership, contacts, roles, moa } = data;
  const viewer = await getViewer(config);
  const good = contacts.filter(usable);
  const avoid = contacts.filter((c) => !usable(c));

  return (
    <article className="flex flex-col gap-4">
      {viewer.isAdmin && <PublishToggle slug={company.slug} published={company.is_published} kind="company" />}
      <header className="glass-strong rounded-[28px] p-5 sm:p-7">
        <h1 className="text-3xl font-semibold tracking-tight">{company.name}</h1>
        {company.legal_name && company.legal_name !== company.name && <p className="mt-1 text-sm text-ink-soft">{company.legal_name}</p>}
        {company.industry && <p className="mt-3 text-ink-soft">{company.industry}{company.hq_location ? `, ${company.hq_location}` : ""}</p>}

        {partnership && (
          <div className="mt-5 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={partnerTone[partnership.status]}>
                {partnerTone[partnership.status] === "good" && <BadgeCheck className="size-3.5" />}
                {partnerLabel[partnership.status]}
              </Badge>
              {moa && <Badge tone="warn">MOA {moa.status.replaceAll("_", " ")}{moa.requested_on ? ` ${dateText(moa.requested_on, config.timezone)}` : ""}</Badge>}
            </div>
            <p className="text-sm text-ink-soft">
              {partnership.matched_name_as_listed
                ? `Listed as "${partnership.matched_name_as_listed}" in the ${config.campus} ${config.hte_list_version} list.`
                : partnership.notes}
            </p>
            {partnership.matched_name_as_listed && partnership.notes && <p className="text-sm text-ink-soft">{partnership.notes}</p>}
          </div>
        )}

        {(company.careers_url || company.website) && (
          <a
            href={company.careers_url ?? company.website ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="glass mt-6 inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium"
          >
            {company.careers_url ? "Careers page" : "Website"} <ArrowUpRight className="size-4" />
          </a>
        )}
      </header>

      {company.description && (
        <section className="glass rounded-[22px] p-5 text-sm leading-relaxed">
          <p>{company.description}</p>
          {(company.founded_year || company.size_text) && (
            <p className="mt-2 text-ink-soft">{[company.founded_year && `Founded ${company.founded_year}`, company.size_text && `${company.size_text} staff`].filter(Boolean).join(", ")}</p>
          )}
          {company.background_source && <p className="mt-2 text-xs text-ink-soft">Source: {company.background_source}</p>}
        </section>
      )}

      {good.length > 0 && (
        <section className="glass rounded-[22px] p-5">
          <h2 className="mb-3 font-semibold">Email</h2>
          <ul className="flex flex-col gap-3">
            {good.map((c) => (
              <li key={c.id} className="flex items-center gap-3">
                <Mail className="size-4 shrink-0 text-ink-soft" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.email}</p>
                  <p className="text-xs text-ink-soft">
                    {purposeText[c.purpose]}, {c.status === "reply_received" ? "has replied before" : "not tested yet"}
                    {c.notes ? `. ${c.notes}` : ""}
                  </p>
                </div>
                <CopyButton value={c.email} label={`Copy ${c.email}`} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {avoid.length > 0 && (
        <section className="rounded-[22px] bg-bad/8 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-bad">
            <Ban className="size-4" /> Do not use
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {avoid.map((c) => (
              <li key={c.id}>
                <span className="break-all line-through decoration-bad/60">{c.email}</span>
                <span className="block text-xs text-ink-soft">
                  {c.status === "bounced" ? `Bounced${c.bounce_code ? ` (${c.bounce_code})` : ""}` : purposeText[c.purpose]}
                  {c.notes ? `. ${c.notes}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="px-1 pt-2 font-semibold">Roles</h2>
        {roles.length === 0 ? (
          <p className="glass rounded-[22px] p-5 text-sm text-ink-soft">No roles listed yet.</p>
        ) : (
          roles.map((r) => <OpportunityCard key={r.id} item={r} timeZone={config.timezone} requiredHours={viewer.requiredHours} maxHours={viewer.maxHours} />)
        )}
      </section>
    </article>
  );
}
