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
    <nav aria-label="My pages" className="glass flex w-fit gap-1 rounded-full p-1">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-10 items-center rounded-full px-4 text-sm font-medium ${active ? "bg-nu-blue text-white" : "text-ink-soft hover:text-ink"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
