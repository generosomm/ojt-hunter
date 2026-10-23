"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Drawer } from "vaul";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { activeCount, COMPANY_SIZES, POSTED_WITHIN, toSearch, type Filters, type Sort } from "@/lib/filters";
import { devLabel, roleLabel, setupLabel, sizeLabel } from "@/lib/labels";
import { DEV_EXPOSURES, ROLE_CATEGORIES, type DevExposure, type RoleCategory } from "@/lib/types";

type Props = { initial: Filters; cities: string[]; requiredHours: number; maxHours: number; canMatch: boolean };

const EMPTY: Omit<Filters, "q" | "sort"> = {
  city: "", roles: [], setups: [], remote: false, min: null, nd: false, hte: false, fits: false, me: false, nov: false, dev: [], closed: false, posted: null, sizes: [],
};

function useUrlFilters(initial: Filters) {
  const router = useRouter();
  const pathname = usePathname();
  const [f, setF] = useState(initial);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // back/forward or a shared link changed the URL from outside: take its filters
  const incoming = toSearch(initial);
  const [prevIncoming, setPrevIncoming] = useState(incoming);
  if (incoming !== prevIncoming) {
    setPrevIncoming(incoming);
    if (incoming !== toSearch(f)) setF(initial);
  }

  const update = (next: Filters, delay = 0) => {
    setF(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => start(() => router.replace(`${pathname}${toSearch(next)}`, { scroll: false })), delay);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return { f, update, pending };
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full px-3.5 text-sm transition-colors ${
        on ? "bg-nu-blue text-white" : "glass text-ink hover:bg-white/70 dark:hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-ink-soft">{title}</legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

function Panel({ f, update, cities, requiredHours, maxHours, canMatch }: { f: Filters; update: (f: Filters, delay?: number) => void; cities: string[]; requiredHours: number; maxHours: number; canMatch: boolean }) {
  const set = (patch: Partial<Filters>, delay = 0) => update({ ...f, ...patch }, delay);
  const hoursHint = maxHours > requiredHours ? `${requiredHours} to ${maxHours} hrs` : `${requiredHours} hrs`;
  return (
    <div className="flex flex-col gap-6">
      <Group title="Sort by">
        {(["pay", "checked", "new"] as Sort[]).map((s) => (
          <Chip key={s} on={f.sort === s} onClick={() => set({ sort: s })}>
            {s === "pay" ? "Pay" : s === "checked" ? "Recently checked" : "Newest post"}
          </Chip>
        ))}
      </Group>

      <Group title="Posted within">
        {POSTED_WITHIN.map((d) => (
          <Chip key={d} on={f.posted === d} onClick={() => set({ posted: f.posted === d ? null : d })}>
            {d} days
          </Chip>
        ))}
      </Group>

      <Group title="Company size">
        {COMPANY_SIZES.map((s) => (
          <Chip key={s} on={f.sizes.includes(s)} onClick={() => set({ sizes: toggle(f.sizes, s) })}>
            {sizeLabel[s]}
          </Chip>
        ))}
      </Group>

      <Group title="Must have">
        {canMatch && <Chip on={f.me} onClick={() => set({ me: !f.me })}>Matches me</Chip>}
        <Chip on={f.hte} onClick={() => set({ hte: !f.hte })}>HTE partner</Chip>
        <Chip on={f.fits} onClick={() => set({ fits: !f.fits })}>Fits {hoursHint}</Chip>
        <Chip on={f.nov} onClick={() => set({ nov: !f.nov })}>Nov start OK</Chip>
      </Group>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-ink-soft">Minimum pay per day</legend>
        <div className="glass flex h-11 items-center rounded-2xl px-4">
          <span className="text-ink-soft">₱</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={50}
            placeholder="Any"
            aria-label="Minimum pay per day in pesos"
            value={f.min ?? ""}
            onChange={(e) => set({ min: e.target.value ? Number(e.target.value) : null }, 400)}
            className="tabular w-full bg-transparent px-2 text-base outline-none"
          />
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" checked={f.nd} onChange={() => set({ nd: !f.nd })} className="size-4 accent-[var(--nu-blue)]" />
          Keep &ldquo;not disclosed&rdquo; (unknown is not unpaid)
        </label>
      </fieldset>

      {cities.length > 0 && (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink-soft">City</span>
          <select value={f.city} onChange={(e) => set({ city: e.target.value })} className="glass h-11 rounded-2xl px-3 text-base">
            <option value="">Anywhere</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      )}

      <Group title="Setup">
        {(["onsite", "hybrid"] as const).map((s) => (
          <Chip key={s} on={f.setups.includes(s)} onClick={() => set({ setups: toggle(f.setups, s) })}>{setupLabel[s]}</Chip>
        ))}
        <Chip on={f.remote} onClick={() => set({ remote: !f.remote })}>Show remote</Chip>
      </Group>
      {f.remote && <p className="-mt-4 text-xs text-warn">Fully remote is not allowed for NU Laguna OJT.</p>}

      <Group title="Role">
        {ROLE_CATEGORIES.map((r: RoleCategory) => (
          <Chip key={r} on={f.roles.includes(r)} onClick={() => set({ roles: toggle(f.roles, r) })}>{roleLabel[r]}</Chip>
        ))}
      </Group>

      <Group title="Kind of work">
        {DEV_EXPOSURES.map((d: DevExposure) => (
          <Chip key={d} on={f.dev.includes(d)} onClick={() => set({ dev: toggle(f.dev, d) })}>{devLabel[d]}</Chip>
        ))}
      </Group>

      <Group title="Posts">
        <Chip on={f.closed} onClick={() => set({ closed: !f.closed })}>Show closed</Chip>
      </Group>
    </div>
  );
}

export function DirectoryFilters({ initial, cities, requiredHours, maxHours, canMatch }: Props) {
  const { f, update, pending } = useUrlFilters(initial);
  const count = activeCount(f);
  const clear = () => update({ ...f, ...EMPTY });
  const panel = <Panel f={f} update={update} cities={cities} requiredHours={requiredHours} maxHours={maxHours} canMatch={canMatch} />;

  return (
    <>
      <div className="flex min-w-0 items-center gap-2 lg:col-start-2 lg:row-start-1">
        <label className="glass flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full px-4">
          <Search className="size-4 shrink-0 text-ink-soft" />
          <input
            type="search"
            placeholder="Company or role"
            aria-label="Search company or role"
            value={f.q}
            onChange={(e) => update({ ...f, q: e.target.value }, 350)}
            className="w-full min-w-0 bg-transparent text-base outline-none placeholder:text-ink-soft"
          />
          {pending && <span aria-hidden className="size-2 shrink-0 animate-pulse rounded-full bg-nu-blue" />}
        </label>

        <Drawer.Root>
          <Drawer.Trigger className="glass relative grid size-12 shrink-0 place-items-center rounded-full lg:hidden" aria-label="Filters">
            <SlidersHorizontal className="size-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-nu-blue text-[11px] font-semibold text-white">{count}</span>
            )}
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
            <Drawer.Content className="glass-strong fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-[28px] outline-none">
              <div aria-hidden className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-ink/20" />
              <div className="flex items-center justify-between px-5 pb-2 pt-3">
                <Drawer.Title className="text-lg font-semibold">Filters</Drawer.Title>
                {count > 0 && (
                  <button type="button" onClick={clear} className="flex h-9 items-center gap-1 rounded-full px-3 text-sm text-ink-soft">
                    <X className="size-4" /> Clear
                  </button>
                )}
              </div>
              <Drawer.Description className="sr-only">Narrow down the OJT list</Drawer.Description>
              <div className="overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{panel}</div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>

      <aside className="hidden lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:block">
        {/* taller than the screen: scroll inside, and stop above the dock */}
        <div className="glass sticky top-20 max-h-[calc(100dvh-11rem)] overflow-y-auto overscroll-contain rounded-[28px] p-5">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Filters</h2>
            {count > 0 && (
              <button type="button" onClick={clear} className="flex h-8 items-center gap-1 rounded-full px-2 text-sm text-ink-soft">
                <X className="size-4" /> Clear
              </button>
            )}
          </div>
          {panel}
        </div>
      </aside>
    </>
  );
}
