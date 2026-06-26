"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  ["", "Panoramica"],
  ["/dati", "Dati e pagamenti"],
  ["/contenuti", "Materiali e brief"],
  ["/richieste", "Richieste"],
];

export function ProjectNavTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  return (
    <nav className="mx-auto mt-5 flex max-w-[1500px] gap-1 overflow-x-auto pb-px">
      {sections.map(([href, label]) => {
        const fullHref = `/admin/projects/${projectId}${href}`;
        const isActive = href === ""
          ? pathname === fullHref
          : pathname.startsWith(fullHref);
        return (
          <Link
            key={href || "overview"}
            href={fullHref}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
