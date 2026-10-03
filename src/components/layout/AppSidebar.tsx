"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";
import { Activity } from "lucide-react";
import { filterNavForRole } from "@/lib/nav-config";
import { useState } from "react";

export function AppSidebar({
  userName,
  role,
}: {
  userName: string;
  role: UserRole;
}) {
  const pathname = usePathname();
  const groups = filterNavForRole(role);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.id, true])),
  );

  return (
    <aside className="flex w-[270px] shrink-0 flex-col bg-gradient-to-b from-[#0b1b3a] via-[#0e2350] to-[#0a1830] text-white">
      <div className="border-b border-white/10 px-4 py-5 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-2 to-primary-light text-white shadow-lg">
          <Activity className="h-6 w-6" strokeWidth={2.25} aria-hidden />
        </div>
        <div className="text-sm font-extrabold leading-snug">الإدارة الطبية المركزية</div>
        <div className="text-[10px] font-semibold text-slate-400">مجمع مدارس الأندalus الخاصة</div>
      </div>
      <div className="mx-3 my-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold">
        {userName}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {groups.map((group) => (
          <div key={group.id} className="mb-1">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400 hover:text-white"
              onClick={() => setOpen((o) => ({ ...o, [group.id]: !o[group.id] }))}
            >
              {group.label}
              <span>{open[group.id] ? "−" : "+"}</span>
            </button>
            {open[group.id] &&
              group.items.map((item) => {
                const active =
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white",
                      active && "border-s-4 border-accent-2 bg-teal-500/10 text-white",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
