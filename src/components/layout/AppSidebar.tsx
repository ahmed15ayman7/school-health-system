"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Apple,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  ClipboardList,
  Download,
  GraduationCap,
  HandHeart,
  LayoutDashboard,
  Megaphone,
  Package,
  Pill,
  QrCode,
  Repeat,
  Search,
  Settings,
  Shield,
  Stethoscope,
  Timer,
  Users,
  Brain,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon; roles?: UserRole[] };

const nav: NavItem[] = [
  { href: "/", label: "لوحة المؤشرات", icon: LayoutDashboard },
  { href: "/clinics", label: "العيادات", icon: Building2 },
  { href: "/students", label: "الطلاب", icon: GraduationCap },
  { href: "/employees", label: "الموظفون", icon: Briefcase },
  { href: "/visits", label: "الزيارات", icon: Stethoscope },
  { href: "/referrals", label: "تحويلات الطلاب", icon: ClipboardList },
  { href: "/referrals/dashboard", label: "تتبع التحويلات", icon: Timer },
  { href: "/emergency", label: "الطوارئ", icon: AlertTriangle },
  { href: "/medications", label: "الأدوية", icon: Pill },
  { href: "/inventory", label: "المخزون", icon: Package },
  { href: "/canteen/inspections", label: "المقصف", icon: Apple },
  { href: "/nurses/attendance", label: "التمريض", icon: Users },
  { href: "/safety/first-aid", label: "السلامة", icon: Shield },
  { href: "/psychology/sessions", label: "النفسي", icon: Brain, roles: ["PSYCHOLOGIST", "MEDICAL_MANAGER", "SUPER_ADMIN"] },
  { href: "/social/cases", label: "الاجتماعي", icon: HandHeart, roles: ["SOCIAL_WORKER", "MEDICAL_MANAGER", "SUPER_ADMIN"] },
  { href: "/internal-referrals", label: "تحويلات داخلية", icon: ArrowLeftRight },
  { href: "/alerts/frequent", label: "مترددون", icon: Repeat },
  { href: "/circulars", label: "التعاميم", icon: Megaphone },
  { href: "/notifications", label: "الإشعارات", icon: Bell },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
  { href: "/search", label: "بحث متقدم", icon: Search },
  { href: "/qr-generator", label: "QR", icon: QrCode },
  { href: "/students/import", label: "استيراد", icon: Download },
  { href: "/settings/users", label: "الإعدادات", icon: Settings, roles: ["SUPER_ADMIN", "MEDICAL_MANAGER"] },
];

export function AppSidebar({
  userName,
  role,
}: {
  userName: string;
  role: UserRole;
}) {
  const pathname = usePathname();
  const items = nav.filter((n) => !n.roles || n.roles.includes(role));

  return (
    <aside className="flex w-[270px] shrink-0 flex-col bg-gradient-to-b from-[#0b1b3a] via-[#0e2350] to-[#0a1830] text-white">
      <div className="border-b border-white/10 px-4 py-5 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-2 to-primary-light text-white shadow-lg">
          <Activity className="h-6 w-6" strokeWidth={2.25} aria-hidden />
        </div>
        <div className="text-sm font-extrabold leading-snug">الإدارة الطبية المركزية</div>
        <div className="text-[10px] font-semibold text-slate-400">مجمع مدارس الأندلس الخاصة</div>
      </div>
      <div className="mx-3 my-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold">
        {userName}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {items.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white",
                active && "border-s-4 border-accent-2 bg-teal-500/10 text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
