import Link from "next/link";
import { BadgeCheck, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/badge";
import { allowanceHeadline, checkedAgo, fitsHours, hoursText } from "@/lib/format";
import { devLabel, devTone, partnerLabel, partnerTone, postLabel, postTone, setupLabel } from "@/lib/labels";
import type { Listing } from "@/lib/types";

type Props = { item: Listing; timeZone: string; requiredHours: number; maxHours: number };

export function OpportunityCard({ item, timeZone, requiredHours, maxHours }: Props) {
  const pay = allowanceHeadline(item);
  const hours = hoursText(item.required_hours_min, item.required_hours_max);
  const fits = fitsHours(item.required_hours_min, item.required_hours_max, requiredHours, maxHours);
  const partner = item.partnership_status;

  return (
    <Link
      href={`/opportunities/${item.slug}`}
      className="glass group flex flex-col gap-4 rounded-[22px] p-4 transition-transform duration-200 active:scale-[0.985] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-ink-soft">{item.company_name}</p>
          <h2 className="mt-0.5 line-clamp-2 font-semibold leading-snug">{item.title}</h2>
        </div>
        {!item.is_published && <Badge tone="warn">Draft</Badge>}
        {item.setup === "remote" && <Badge tone="bad">Remote: not allowed for NU Laguna OJT</Badge>}
      </div>

      <p className="tabular">
        <span className={`text-2xl font-semibold tracking-tight ${item.allowance_status === "disclosed" ? "" : "text-ink-soft"}`}>{pay.main}</span>
        {pay.unit && <span className="ml-1 text-sm text-ink-soft">{pay.unit}</span>}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        {partner && (
          <Badge tone={partnerTone[partner]}>
            {partnerTone[partner] === "good" && <BadgeCheck className="size-3.5" />}
            {partnerLabel[partner]}
          </Badge>
        )}
        <Badge tone={postTone[item.post_status]}>{postLabel[item.post_status]}</Badge>
        {item.dev_exposure !== "unknown" && <Badge tone={devTone[item.dev_exposure]}>{devLabel[item.dev_exposure]}</Badge>}
        {hours && <Badge tone={fits === false ? "bad" : "muted"}>{hours}</Badge>}
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-ink-soft">
        <span className="flex min-w-0 items-center gap-1">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {item.city ?? "Location unknown"}, {setupLabel[item.setup].toLowerCase()}
          </span>
        </span>
        <span className={`flex shrink-0 items-center gap-1 ${item.needs_recheck ? "text-warn" : ""}`}>
          <Clock className="size-3.5" />
          {item.needs_recheck ? "Needs re-check" : checkedAgo(item.last_checked_at, timeZone)}
        </span>
      </div>
    </Link>
  );
}
