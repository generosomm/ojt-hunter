import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { IdCardHero } from "@/components/id-card-hero";
import { DirectoryFilters } from "@/components/filters";
import { OpportunityCard } from "@/components/opportunity-card";
import { getConfig, getDirectoryStats, getListings, getViewer } from "@/lib/data";
import { cityOptions, parseFilters } from "@/lib/filters";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-28">
      {/* the headline is static; only the card's numbers wait for the database, in a same-size placeholder (no layout shift) */}
      <section className="grid items-center gap-8 pb-10 pt-8 sm:grid-cols-[1fr_auto] sm:pt-14">
        <div>
          <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-7xl">
            Find your
            <br />
            OJT.
          </h1>
          <p className="mt-4 max-w-sm text-ink-soft">Real pay, HTE status and where to apply.</p>
        </div>
        <Suspense fallback={<CardSkeleton />}>
          <HeroCard />
        </Suspense>
      </section>
      <Suspense fallback={<ListSkeleton />}>
        <Directory searchParams={searchParams} />
      </Suspense>
      <footer className="mt-10 flex justify-center gap-4 text-xs text-ink-soft">
        <Link href="/privacy" className="underline-offset-4 hover:underline">Privacy</Link>
        <a href="https://github.com/generosomm/ojt-hunter" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">Source code</a>
      </footer>
    </main>
  );
}

async function HeroCard() {
  await connection();
  const [config, stats] = await Promise.all([getConfig(), getDirectoryStats()]);
  return <IdCardHero live={stats.live} partners={stats.partners} campus={config.campus} />;
}

async function Directory({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  await connection();
  const filters = parseFilters(await searchParams);
  const config = await getConfig();
  const viewer = await getViewer(config);
  const [items, stats] = await Promise.all([getListings(filters, viewer), getDirectoryStats()]);

  return (
    <section aria-label="OJT openings" className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
      <DirectoryFilters
        initial={filters}
        cities={cityOptions(stats.cities)}
        requiredHours={viewer.requiredHours}
        maxHours={viewer.maxHours}
        canMatch={Boolean(viewer.userId)}
      />
      <div className="flex min-w-0 flex-col gap-3 lg:col-start-2">
        <p className="px-1 text-sm text-ink-soft" aria-live="polite">
          {items.length} {items.length === 1 ? "role" : "roles"}
        </p>
        {items.length === 0 ? (
          <div className="glass rounded-[22px] p-8 text-center">
            <p className="font-medium">Nothing matches yet.</p>
            <p className="mt-1 text-sm text-ink-soft">Remove a filter, or check back after new roles are reviewed.</p>
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {items.map((item) => (
              <OpportunityCard key={item.id} item={item} timeZone={config.timezone} requiredHours={viewer.requiredHours} maxHours={viewer.maxHours} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// same box as IdCardHero: 40px lanyard + a 1.58:1 card, 340px wide at most
function CardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[340px] sm:w-[340px]">
      <div className="h-10" />
      <div className="glass-strong aspect-[1.58/1] w-full animate-pulse rounded-[26px]" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass h-40 animate-pulse rounded-[22px]" />
      ))}
    </div>
  );
}
