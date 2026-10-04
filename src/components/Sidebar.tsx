"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  FileStack,
  Network,
  Scale,
  Sparkles,
  Gavel,
  Inbox,
  HardDriveUpload,
  Users,
  GitMerge,
  Waypoints,
  ListTree,
  Clock,
  ShieldCheck,
  CalendarClock,
  Share2,
  LayoutDashboard,
  Settings,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type NavGroup = {
  id: string;
  title: string;
  accent: string;
  dotColor: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    id: "docket-key",
    title: "Docket-Key",
    accent: "text-sky-600",
    dotColor: "bg-sky-500",
    items: [
      { href: "/docket-key", label: "Docket Viewer", icon: Gavel },
      { href: "/ingestion", label: "Ingestion Queue", icon: Inbox },
      { href: "/documents", label: "Document Review Queue", icon: Inbox },
      { href: "/docket-key/connectors", label: "Drive & Ingest Connectors", icon: HardDriveUpload },
    ],
  },
  {
    id: "converge",
    title: "Converge",
    accent: "text-violet-600",
    dotColor: "bg-violet-500",
    items: [
      { href: "/converge", label: "Contact Directory", icon: Users },
      { href: "/converge/resolution", label: "Fuzzy / Alias Resolution", icon: GitMerge },
    ],
  },
  {
    id: "core",
    title: "CaseVault Core",
    accent: "text-emerald-600",
    dotColor: "bg-emerald-500",
    items: [
      { href: "/matters", label: "Matters & Claims", icon: Scale },
      { href: "/matters/chronology", label: "Chronology Timeline", icon: Clock },
      { href: "/matters/deadlines", label: "Deadlines & Tasks", icon: CalendarClock },
    ],
  },
  {
    id: "intelligence",
    title: "Intelligence",
    accent: "text-amber-600",
    dotColor: "bg-amber-500",
    items: [
      { href: "/intelligence", label: "AI Proposals", icon: Sparkles },
      { href: "/intelligence/graph", label: "Knowledge Graph", icon: Share2 },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="flex h-screen w-72 flex-shrink-0 flex-col border-r border-slate-800 bg-[#0b0f1a] text-slate-200">
      <div className="flex items-center gap-2.5 border-b border-slate-800 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 text-white shadow-lg shadow-indigo-900/40">
          <ShieldCheck size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-white">CASEVAULT 2.0</p>
          <p className="text-[11px] text-slate-500">Single-user litigation vault</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 scrollbar-dark">
        <Link
          href="/"
          className={clsx(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
            isActive("/")
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white",
          )}
        >
          <LayoutDashboard size={16} />
          Dashboard
        </Link>

        {groups.map((group) => (
          <div key={group.id}>
            <div className="mb-1.5 flex items-center gap-2 px-3">
              <span className={clsx("h-1.5 w-1.5 rounded-full", group.dotColor)} />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {group.title}
              </p>
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon size={16} className={active ? group.accent : undefined} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-4 py-4">
        <Link href="/settings" className={clsx("mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm", isActive("/settings") ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white")}><Settings size={16} />Settings</Link>
        <form action="/api/logout" method="post"><button type="submit" className="mb-3 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 hover:bg-white/5 hover:text-white">Sign out</button></form>
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 text-xs text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
          </span>
          Private evidence workspace
        </div>
      </div>
    </aside>
  );
}
