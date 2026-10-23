"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/me/tracker", label: "Tracker" },
  { href: "/me/checklist", label: "Checklist" },
  { href: "/templates", label: "Templates" },
  { href: "/me/profile", label: "Profile" },
];

export function MeTabs() {
  const pathname = usePathname();
  return (
    // phones: four tabs share the width evenly (a fixed width overflowed 375px screens)
    <nav aria-label="My pages" className="glass flex w-full gap-1 rounded-full p-1 sm:w-fit">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-10 flex-1 items-center justify-center rounded-full px-2 text-sm font-medium sm:flex-none sm:px-4 ${active ? "bg-nu-blue text-white" : "text-ink-soft hover:text-ink"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
