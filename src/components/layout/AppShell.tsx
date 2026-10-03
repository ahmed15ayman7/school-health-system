"use client";

import Link from "next/link";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@prisma/client";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { formatAppDateTime } from "@/lib/tz";
import { Bell, Menu, PanelRightClose } from "lucide-react";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "app-sidebar-open";

function useIsLargeScreen() {
  const [isLg, setIsLg] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLg(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isLg;
}

export function AppShell({
  children,
  userName,
  role,
  clinicName,
}: {
  children: React.ReactNode;
  userName: string;
  role: UserRole;
  clinicName?: string;
}) {
  const [now, setNow] = useState("");
  const isLg = useIsLargeScreen();
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const tick = () => setNow(formatAppDateTime(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) setDesktopOpen(stored === "true");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (isLg) setMobileOpen(false);
  }, [isLg]);

  const sidebarVisible = isLg ? desktopOpen : mobileOpen;

  const toggleSidebar = useCallback(() => {
    if (isLg) {
      setDesktopOpen((prev) => {
        const next = !prev;
        try {
          localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    } else {
      setMobileOpen((prev) => !prev);
    }
  }, [isLg]);

  const closeMobileSidebar = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* خلفية موبايل/تابلت */}
      {!isLg && mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
          aria-label="إغلاق القائمة"
          onClick={closeMobileSidebar}
        />
      )}

      <AppSidebar
        userName={userName}
        role={role}
        visible={hydrated ? sidebarVisible : isLg}
        isLargeScreen={isLg}
        onNavigate={closeMobileSidebar}
        onClose={toggleSidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-gradient-to-l from-[#0a1830] via-[#0e2350] to-[#16357a] px-3 py-2.5 text-white shadow-md sm:px-4 sm:py-3 lg:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 shrink-0 border border-white/20 bg-white/10 p-0 text-white hover:bg-white/20"
                onClick={toggleSidebar}
                aria-expanded={sidebarVisible}
                aria-label={sidebarVisible ? "إخفاء القائمة الجانبية" : "إظهار القائمة الجانبية"}
              >
                {sidebarVisible && isLg ? (
                  <PanelRightClose className="h-4 w-4" aria-hidden />
                ) : (
                  <Menu className="h-4 w-4" aria-hidden />
                )}
              </Button>
              <div className="min-w-0 border-s border-white/15 ps-2 sm:ps-3">
                <h1 className="truncate text-sm font-black sm:text-base">منظومة الإدارة الطبية</h1>
                {clinicName && (
                  <p className="truncate text-[10px] font-bold text-white/70 sm:text-xs">{clinicName}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <span className="hidden rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/90 sm:inline sm:px-3 sm:text-xs">
                {now}
              </span>
              <Link href="/emergency/new">
                <Button variant="danger" size="sm" className="animate-pulse text-xs shadow-lg sm:text-sm">
                  <span className="hidden sm:inline">SOS </span>طوارئ
                </Button>
              </Link>
              <Link
                href="/notifications"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20"
                aria-label="الإشعارات"
              >
                <Bell className="h-4 w-4" aria-hidden />
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 bg-white/10 text-xs text-white hover:bg-white/20 sm:text-sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                خروج
              </Button>
            </div>
          </div>
        </header>
        <main
          className={cn(
            "flex-1 overflow-x-hidden overflow-y-auto",
            "p-3 sm:p-4 md:p-5 lg:p-6",
          )}
        >
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
