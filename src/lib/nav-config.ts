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
  FlaskConical,
  Droplets,
  FileBadge,
} from "lucide-react";
import { can, type Resource, type Action } from "@/lib/rbac";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  resource?: Resource;
  action?: Action;
  ready?: boolean;
  roles?: UserRole[];
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavLink[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "core",
    label: "الرئيسية",
    items: [
      { href: "/", label: "لوحة المؤشرات", icon: LayoutDashboard, ready: true },
      { href: "/clinics", label: "العيادات", icon: Building2, resource: "settings", action: "read", ready: true },
    ],
  },
  {
    id: "clinical",
    label: "العيادة والتحويلات",
    items: [
      { href: "/students", label: "الطلاب", icon: GraduationCap, resource: "students", action: "read", ready: true },
      { href: "/employees", label: "الموظفون", icon: Briefcase, resource: "employees", action: "read", ready: true },
      { href: "/visits", label: "الزيارات", icon: Stethoscope, resource: "visits", action: "read", ready: true },
      { href: "/referrals", label: "تحويلات الطلاب", icon: ClipboardList, resource: "student_referrals", action: "read", ready: true },
      { href: "/referrals/dashboard", label: "تتبع التحويلات", icon: Timer, resource: "student_referrals", action: "read", ready: true },
      { href: "/emergency", label: "الطوارئ", icon: AlertTriangle, resource: "emergency", action: "read", ready: true },
    ],
  },
  {
    id: "pharmacy",
    label: "الصيدلية والمخزون",
    items: [
      { href: "/medications", label: "الأدوية", icon: Pill, resource: "medications", action: "read", ready: true },
      { href: "/medications/doses", label: "جرعات اليوم", icon: Pill, resource: "mar", action: "read", ready: true },
      { href: "/inventory", label: "المخزون", icon: Package, resource: "inventory", action: "read", ready: true },
    ],
  },
  {
    id: "ehs",
    label: "السلامة والامتثال",
    items: [
      { href: "/safety/inspections", label: "فحوص السلامة", icon: Shield, resource: "safety", action: "read", ready: true },
      { href: "/safety/labs", label: "مختبرات العلوم", icon: FlaskConical, resource: "safety", action: "read", ready: true },
      { href: "/safety/water", label: "فحص المياه", icon: Droplets, resource: "safety", action: "read", ready: true },
      { href: "/safety/licenses", label: "التراخيص", icon: FileBadge, resource: "safety", action: "read", ready: true },
      { href: "/safety/aed", label: "أجهزة AED", icon: Activity, resource: "safety", action: "read", ready: true },
      { href: "/safety/first-aid", label: "حقائب الإسعاف", icon: Shield, resource: "safety", action: "read", ready: true },
    ],
  },
  {
    id: "canteen",
    label: "المقصف",
    items: [
      { href: "/canteen/inspections", label: "تفتيش المقصف", icon: Apple, resource: "canteen", action: "read", ready: true },
      { href: "/canteen/staff-certs", label: "شهادات العاملين", icon: FileBadge, resource: "canteen", action: "read", ready: true },
    ],
  },
  {
    id: "support",
    label: "دعم الطالب",
    items: [
      { href: "/psychology/sessions", label: "النفسي", icon: Brain, resource: "psychology", action: "read", ready: true },
      { href: "/social/cases", label: "الاجتماعي", icon: HandHeart, resource: "social", action: "read", ready: true },
      { href: "/internal-referrals", label: "تحويلات داخلية", icon: ArrowLeftRight, resource: "internal_referrals", action: "read", ready: true },
      { href: "/nurses/attendance", label: "التمريض", icon: Users, resource: "nursing", action: "read", ready: false },
    ],
  },
  {
    id: "system",
    label: "النظام",
    items: [
      { href: "/alerts/frequent", label: "مترددون", icon: Repeat, resource: "students", action: "read", ready: true },
      { href: "/circulars", label: "التعاميم", icon: Megaphone, resource: "circulars", action: "read", ready: true },
      { href: "/notifications", label: "الإشعارات", icon: Bell, resource: "circulars", action: "read", ready: true },
      { href: "/reports", label: "التقارير", icon: BarChart3, resource: "reports", action: "read", ready: true },
      { href: "/search", label: "بحث متقدم", icon: Search, resource: "students", action: "read", ready: true },
      { href: "/qr-generator", label: "QR", icon: QrCode, resource: "settings", action: "read", ready: true },
      { href: "/students/import", label: "استيراد", icon: Download, resource: "students", action: "create", ready: true },
      { href: "/settings/users", label: "الإعدادات", icon: Settings, resource: "settings", action: "read", ready: true, roles: ["SUPER_ADMIN", "MEDICAL_MANAGER"] },
    ],
  },
];

export function filterNavForRole(role: UserRole): NavGroup[] {
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => {
      if (item.ready === false) return false;
      if (item.roles && !item.roles.includes(role)) return false;
      if (item.resource && item.action && !can(role, item.resource, item.action)) return false;
      return true;
    }),
  })).filter((g) => g.items.length > 0);
}
