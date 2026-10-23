"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck, Briefcase, Handshake, Mail } from "lucide-react";

const items = [
  { href: "/", label: "Roles", icon: Briefcase, match: (p: string) => p === "/" || p.startsWith("/opportunities") || p.startsWith("/companies") },
  { href: "/partnership-checker", label: "HTE", icon: BadgeCheck, match: (p: string) => p.startsWith("/partnership-checker") },
  { href: "/moa-board", label: "MOA", icon: Handshake, match: (p: string) => p.startsWith("/moa-board") },
  { href: "/cold-emails", label: "Emails", icon: Mail, match: (p: string) => p.startsWith("/cold-emails") },
];

// floating glass dock, like the macOS one; same on phone and desktop
export function Dock() {
  const pathname = usePathname();
  return (
    <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <ul className="glass-strong flex items-center gap-1 rounded-full p-1.5">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-12 min-w-16 flex-col items-center justify-center gap-0.5 rounded-full px-3 text-[11px] font-medium transition-colors ${
                  active ? "bg-nu-blue text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                <Icon className="size-[18px]" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
