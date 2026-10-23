import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { ArrowUpRight, BadgeCheck, Briefcase, CalendarClock, Clock, Code2, Link2Off, Mail, MapPin, Search, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/badge";
import { AdminRoleEditor } from "@/components/admin-role-editor";
import { PublishToggle } from "@/components/publish-toggle";
import { SaveRoleButton } from "@/components/save-role-button";
import { StillOpen } from "@/components/still-open";
import { getSavedOpportunityIds } from "@/lib/me";
import { getConfig, getJobBoards, getOpportunity, getViewer } from "@/lib/data";
import { allowanceHeadline, boardSearchUrl, boardSearchWords, checkedAgo, postedAgo, dateText, fitsHours, hoursText } from "@/lib/format";
import { applyLabel, devLabel, devTone, novLabel, partnerLabel, partnerTone, postLabel, postTone, setupLabel } from "@/lib/labels";

export async function generateMetadata({ params }: PageProps<"/opportunities/[slug]">): Promise<Metadata> {
  await connection();
  const data = await getOpportunity((await params).slug);
  return data
    ? { title: `${data.opp.title} at ${data.opp.company_name}`, description: `OJT at ${data.opp.company_name}${data.opp.city ? ` in ${data.opp.city}` : ""}: pay, HTE status and how to apply.` }
    : { title: "Role not found" };
}

export default function OpportunityPage({ params }: PageProps<"/opportunities/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6">
      <Suspense fallback={<div className="glass h-96 animate-pulse rounded-[28px]" />}>
        <Opportunity params={params} />
      </Suspense>
    </main>
  );
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="glass flex min-h-20 flex-col justify-between gap-2 rounded-2xl p-3.5">
      <span className="flex items-center gap-1.5 text-xs text-ink-soft">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium leading-snug">{children}</span>
    </div>
  );
}

async function Opportunity({ params }: Pick<PageProps<"/opportunities/[slug]">, "params">) {
  await connection();
  const { slug } = await params;
  const [data, config, boards] = await Promise.all([getOpportunity(slug), getConfig(), getJobBoards()]);
  if (!data) notFound();
  const [viewer, saved] = await Promise.all([getViewer(config), getSavedOpportunityIds()]);
  const { opp, facts, checks } = data;
  const pay = allowanceHeadline(opp);
  const hours = hoursText(opp.required_hours_min, opp.required_hours_max);
  const fits = fitsHours(opp.required_hours_min, opp.required_hours_max, viewer.requiredHours, viewer.maxHours);
  const partner = opp.partnership_status;

  return (
    <article className="flex flex-col gap-4">
      {viewer.isAdmin && (
        <div className="flex flex-col gap-2">
          <PublishToggle slug={opp.slug} published={opp.is_published} />
          <AdminRoleEditor opp={opp} />
        </div>
      )}

      <header className="glass-strong rounded-[28px] p-5 sm:p-7">
        <Link href={`/companies/${opp.company_slug}`} className="text-sm text-ink-soft underline-offset-4 hover:underline">
          {opp.company_name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{opp.title}</h1>

        <p className="tabular mt-6">
          <span className={`text-4xl font-semibold tracking-tight sm:text-5xl ${opp.allowance_status === "disclosed" ? "" : "text-ink-soft"}`}>{pay.main}</span>
          {pay.unit && <span className="ml-1.5 text-ink-soft">{pay.unit}</span>}
        </p>
        {opp.allowance_source && <p className="mt-2 max-w-prose text-sm text-ink-soft">{opp.allowance_source}</p>}

        <div className="mt-5 flex flex-wrap gap-1.5">
          {partner && (
            <Badge tone={partnerTone[partner]} title={opp.matched_name_as_listed ?? undefined}>
              {partnerTone[partner] === "good" && <BadgeCheck className="size-3.5" />}
              {partnerLabel[partner]}
            </Badge>
          )}
          <Badge tone={postTone[opp.post_status]}>{postLabel[opp.post_status]}</Badge>
          {opp.dev_exposure !== "unknown" && <Badge tone={devTone[opp.dev_exposure]}>{devLabel[opp.dev_exposure]}</Badge>}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {opp.apply_url && opp.link_status === "dead" ? (
            // the nightly check found the post gone: send people to the job boards instead of a dead page
            <span className="flex h-12 items-center justify-center gap-2 rounded-full bg-warn/12 px-6 text-sm font-medium text-warn">
              <Link2Off className="size-4" /> Post link is down
            </span>
          ) : opp.apply_url && (
            <a
              href={opp.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-nu-blue px-7 font-medium text-white"
            >
              Apply on {applyLabel[opp.apply_channel] ?? "the site"}
              <ArrowUpRight className="size-4" />
            </a>
          )}
          <SaveRoleButton opportunityId={opp.id} saved={saved.has(opp.id)} signedIn={Boolean(viewer.userId)} />
          <Link
            href={`/templates?t=${opp.partnership_status === "not_listed" ? "moa_question" : "application"}&role=${opp.slug}`}
            className="glass flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium"
          >
            <Mail className="size-4" /> Draft email
          </Link>
        </div>
        {opp.apply_instructions && <p className="mt-3 text-sm text-ink-soft">{opp.apply_instructions}</p>}

        {boards.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 flex items-center gap-1 text-xs text-ink-soft">
              <Search className="size-3.5" /> Find it on
            </span>
            {boards.map((b) => (
              <a
                key={b.name}
                href={boardSearchUrl(b.search_url, boardSearchWords(opp.company_name))}
                target="_blank"
                rel="noopener noreferrer"
                className="glass flex h-8 items-center gap-1 rounded-full px-3 text-xs font-medium hover:bg-white/50"
              >
                {b.name}
                <ArrowUpRight className="size-3" />
              </a>
            ))}
          </div>
        )}
      </header>

      {opp.is_published && <StillOpen opportunityId={opp.id} slug={opp.slug} signedIn={Boolean(viewer.userId)} />}

      {opp.setup === "remote" && (
        <p className="flex items-center gap-2 rounded-2xl bg-warn/12 p-4 text-sm text-warn">
          <TriangleAlert className="size-4 shrink-0" /> Fully remote. Not allowed for {config.campus} OJT.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Fact icon={<MapPin className="size-3.5" />} label="Where">
          {opp.city ?? "Unknown"}
          <span className="block text-ink-soft">
            {setupLabel[opp.setup]}
            {opp.onsite_days_per_week ? `, ${opp.onsite_days_per_week} office day${opp.onsite_days_per_week > 1 ? "s" : ""}/wk` : ""}
          </span>
        </Fact>
        <Fact icon={<Clock className="size-3.5" />} label="Hours">
          {hours ?? "Not stated"}
          {fits === false && <span className="block text-bad">Outside your {viewer.requiredHours} hrs</span>}
          {opp.duration_text && <span className="block text-ink-soft">{opp.duration_text}</span>}
        </Fact>
        <Fact icon={<CalendarClock className="size-3.5" />} label="Start">
          {novLabel[opp.accepts_nov_start]}
          {opp.intake_text && <span className="block text-ink-soft">{opp.intake_text}</span>}
        </Fact>
        {opp.schedule_text && (
          <Fact icon={<Clock className="size-3.5" />} label="Schedule">{opp.schedule_text}</Fact>
        )}
        {opp.company_size_text && (
          <Fact icon={<Briefcase className="size-3.5" />} label="Company size">{opp.company_size_text}</Fact>
        )}
        {opp.employment_type !== "unknown" && (
          <Fact icon={<Briefcase className="size-3.5" />} label="Type">{opp.employment_type === "part_time" ? "Part-time" : "Full-time"}</Fact>
        )}
        {opp.tech_stack.length > 0 && (
          <Fact icon={<Code2 className="size-3.5" />} label="Stack">{opp.tech_stack.join(", ")}</Fact>
        )}
        <Fact icon={<Clock className="size-3.5" />} label="Last checked">
          {checkedAgo(opp.last_checked_at, config.timezone)}
          {opp.needs_recheck && <span className="block text-warn">Needs re-check</span>}
          {opp.posted_on && <span className="block text-ink-soft">{postedAgo(opp.posted_on, config.timezone)}</span>}
        </Fact>
      </div>

      {(opp.duties || opp.school_requirements || opp.notes || opp.office_address) && (
        <section className="glass flex flex-col gap-4 rounded-[22px] p-5 text-sm leading-relaxed">
          {opp.duties && <Detail title="The work">{opp.duties}</Detail>}
          {opp.school_requirements && <Detail title="They ask for">{opp.school_requirements}</Detail>}
          {opp.office_address && <Detail title="Office">{opp.office_address}</Detail>}
          {opp.notes && <Detail title="Good to know">{opp.notes}</Detail>}
        </section>
      )}

      <details className="glass group rounded-[22px] p-5 text-sm">
        <summary className="cursor-pointer list-none font-medium marker:hidden">
          Sources and checks <span className="text-ink-soft">({facts.length + checks.length})</span>
        </summary>
        <ul className="mt-4 flex flex-col gap-3">
          {facts.map((f) => (
            <li key={f.id} className="flex flex-col">
              <span>{f.value}</span>
              <span className="text-xs text-ink-soft">
                {f.state}, {f.source_type.replaceAll("_", " ")}
                {f.observed_on ? `, ${dateText(f.observed_on, config.timezone)}` : ""}
              </span>
            </li>
          ))}
          {checks.map((c, i) => (
            <li key={i} className="text-xs text-ink-soft">
              Classmate check: {c.result.replaceAll("_", " ")}, {dateText(c.checked_at, config.timezone)}
            </li>
          ))}
          {opp.source_url && (
            <li>
              <a href={opp.source_url} target="_blank" rel="noopener noreferrer" className="text-nu-blue underline underline-offset-4 dark:text-nu-gold">
                Original post
              </a>
            </li>
          )}
        </ul>
      </details>
    </article>
  );
}

function Detail({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-1 font-medium">{title}</h2>
      <p className="text-ink-soft">{children}</p>
    </div>
  );
}
