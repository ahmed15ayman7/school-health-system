"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";
import { Activity, X } from "lucide-react";
import { filterNavForRole } from "@/lib/nav-config";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function AppSidebar({
  userName,
  role,
  visible,
  isLargeScreen,
  onNavigate,
  onClose,
}: {
  userName: string;
  role: UserRole;
  visible: boolean;
  isLargeScreen: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const groups = filterNavForRole(role);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.id, true])),
  );

  useEffect(() => {
    onNavigate?.();
  }, [pathname, onNavigate]);

  return (
    <aside
      id="app-sidebar"
      aria-hidden={!visible}
      className={cn(
        "flex w-[min(100vw-2rem,280px)] shrink-0 flex-col bg-gradient-to-b from-[#0b1b3a] via-[#0e2350] to-[#0a1830] text-white shadow-xl transition-[transform,width,opacity] duration-300 ease-out",
        "max-lg:fixed max-lg:inset-y-0 max-lg:start-0 max-lg:z-50",
        !isLargeScreen && !visible && "max-lg:pointer-events-none max-lg:translate-x-full max-lg:opacity-0",
        !isLargeScreen && visible && "max-lg:translate-x-0 max-lg:opacity-100",
        isLargeScreen && !visible && "lg:hidden",
        isLargeScreen && visible && "lg:flex lg:w-[270px]",
      )}
    >
      <div className="relative border-b border-white/10 px-4 py-4 text-center sm:py-5">
        {!isLargeScreen && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute end-2 top-2 h-8 w-8 p-0 text-white hover:bg-white/10"
            onClick={onClose}
            aria-label="إغلاق القائمة"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        )}
        <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-2 to-primary-light text-white shadow-lg sm:h-12 sm:w-12">
          <Activity className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} aria-hidden />
        </div>
        <div className="text-sm font-extrabold leading-snug">الإدارة الطبية المركزية</div>
        <div className="text-[10px] font-semibold text-slate-400">مجمع مدارس الأندalus الخاصة</div>
      </div>
      <div className="mx-3 my-2 truncate rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold sm:my-3">
        {userName}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain px-2 pb-4">
        {groups.map((group) => (
          <div key={group.id} className="mb-1">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400 hover:text-white"
              onClick={() => setOpen((o) => ({ ...o, [group.id]: !o[group.id] }))}
            >
              {group.label}
              <span aria-hidden>{open[group.id] ? "−" : "+"}</span>
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
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white active:bg-white/15",
                      active && "border-s-4 border-accent-2 bg-teal-500/10 text-white",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                    <span className="leading-snug">{item.label}</span>
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>
      {isLargeScreen && onClose && (
        <div className="hidden border-t border-white/10 p-3 lg:block">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg px-3 py-2 text-xs font-bold text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            إخفاء القائمة
          </button>
        </div>
      )}
    </aside>
  );
}
