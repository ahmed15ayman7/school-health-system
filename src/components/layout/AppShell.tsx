"use client";

import Link from "next/link";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@prisma/client";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { formatAppDateTime } from "@/lib/tz";
import { Bell } from "lucide-react";

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
  useEffect(() => {
    const tick = () => setNow(formatAppDateTime(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar userName={userName} role={role} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-white/80 px-5 py-3 backdrop-blur-md dark:bg-[#0e2350]/80">
          <div>
            <h1 className="text-base font-black text-primary">منظومة الإدارة الطبية</h1>
            {clinicName && <p className="text-xs font-bold text-muted">{clinicName}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-slate-50 px-3 py-1 text-xs font-bold text-muted">
              {now}
            </span>
            <Link href="/emergency/new">
              <Button variant="danger" size="sm" className="animate-pulse">
                SOS طوارئ
              </Button>
            </Link>
            <Link
              href="/notifications"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-primary hover:bg-slate-50"
              aria-label="الإشعارات"
            >
              <Bell className="h-4 w-4" aria-hidden />
            </Link>
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
              خروج
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
