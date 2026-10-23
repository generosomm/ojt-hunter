// Directory filters live in the URL so a filtered view can be shared in Messenger.
import { DEV_EXPOSURES, ROLE_CATEGORIES, SETUPS, type DevExposure, type RoleCategory, type Setup } from "./types";

export type Sort = "pay" | "checked" | "new";

// "posted within" choices, in days
export const POSTED_WITHIN = [3, 7, 14, 30] as const;
export type PostedWithin = (typeof POSTED_WITHIN)[number];

export type Filters = {
  q: string;
  city: string;
  roles: RoleCategory[];
  setups: Setup[];
  remote: boolean; // remote is hidden unless asked for: NU Laguna does not allow it
  min: number | null; // pesos per day
  nd: boolean; // keep "not disclosed" rows when a minimum is set
  hte: boolean;
  fits: boolean;
  me: boolean; // apply the signed-in profile: cities, minimum pay, hours
  nov: boolean;
  dev: DevExposure[];
  closed: boolean;
  posted: PostedWithin | null; // only roles the company posted in the last N days
  sort: Sort;
};

type Params = Record<string, string | string[] | undefined>;

const one = (p: Params, k: string) => {
  const v = p[k];
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
};
const list = <T extends string>(p: Params, k: string, allowed: readonly T[]) =>
  one(p, k).split(",").filter((x): x is T => (allowed as readonly string[]).includes(x));
const flag = (p: Params, k: string) => one(p, k) === "1";

export function parseFilters(p: Params): Filters {
  const min = Number(one(p, "min"));
  const sort = one(p, "sort");
  const posted = Number(one(p, "posted"));
  return {
    // only letters, numbers and spaces reach the database filter
    q: one(p, "q").replace(/[^\p{L}\p{N} &.-]/gu, " ").replace(/\s+/g, " ").slice(0, 60).trim(),
    city: one(p, "city").replace(/[^\p{L} .-]/gu, "").slice(0, 40),
    roles: list(p, "role", ROLE_CATEGORIES),
    setups: list(p, "setup", SETUPS),
    remote: flag(p, "remote"),
    min: Number.isFinite(min) && min > 0 ? Math.min(Math.round(min), 100000) : null,
    nd: flag(p, "nd"),
    hte: flag(p, "hte"),
    fits: flag(p, "fits"),
    me: flag(p, "me"),
    nov: flag(p, "nov"),
    dev: list(p, "dev", DEV_EXPOSURES),
    closed: flag(p, "closed"),
    posted: (POSTED_WITHIN as readonly number[]).includes(posted) ? (posted as PostedWithin) : null,
    sort: sort === "checked" || sort === "new" ? sort : "pay",
  };
}

export function toSearch(f: Filters) {
  const s = new URLSearchParams();
  if (f.q) s.set("q", f.q);
  if (f.city) s.set("city", f.city);
  if (f.roles.length) s.set("role", f.roles.join(","));
  if (f.setups.length) s.set("setup", f.setups.join(","));
  if (f.remote) s.set("remote", "1");
  if (f.min) s.set("min", String(f.min));
  if (f.nd) s.set("nd", "1");
  if (f.hte) s.set("hte", "1");
  if (f.fits) s.set("fits", "1");
  if (f.me) s.set("me", "1");
  if (f.nov) s.set("nov", "1");
  if (f.dev.length) s.set("dev", f.dev.join(","));
  if (f.closed) s.set("closed", "1");
  if (f.posted) s.set("posted", String(f.posted));
  if (f.sort !== "pay") s.set("sort", f.sort);
  const out = s.toString();
  return out ? `?${out}` : "";
}

export function activeCount(f: Filters) {
  return [f.me, f.city, f.roles.length, f.setups.length, f.remote, f.min, f.hte, f.fits, f.nov, f.dev.length, f.closed, f.posted].filter(Boolean).length;
}

// city strings are free text ("Makati / Taguig (BGC)"), so options are the single place names found in them
export function cityOptions(cities: (string | null)[]) {
  const set = new Set<string>();
  for (const c of cities) {
    for (const part of (c ?? "").split(/[/(),]| or /)) {
      const t = part.trim();
      if (/^[A-Z][a-z]+$/.test(t)) set.add(t);
    }
  }
  return [...set].sort();
}
