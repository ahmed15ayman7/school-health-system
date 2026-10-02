import fs from "fs";
import path from "path";

const root = path.join(import.meta.dirname, "..", "src", "app", "(app)");

const pages = [
  ["clinics", "العيادات"],
  ["clinics/[id]", "لوحة العيادة"],
  ["students", "الطلاب"],
  ["students/new", "إضافة طالب"],
  ["students/import", "استيراد الطلاب"],
  ["students/[id]", "ملف الطالب"],
  ["students/[id]/history", "السجل المرضي"],
  ["students/[id]/visit", "زيارة طالب"],
  ["employees", "الموظفون"],
  ["employees/new", "إضافة موظف"],
  ["employees/[id]", "ملف الموظف"],
  ["visits", "سجل الزيارات"],
  ["visits/new", "زيارة جديدة"],
  ["visits/[id]", "تفاصيل الزيارة"],
  ["referrals", "تحويلات الطلاب"],
  ["referrals/new", "تحويل جديد"],
  ["referrals/dashboard", "لوحة تتبع التحويلات"],
  ["referrals/[id]", "تفاصيل التحويل"],
  ["emergency", "الحالات الطارئة"],
  ["emergency/new", "حالة طارئة"],
  ["medications", "الأدوية"],
  ["medications/new", "إضافة دواء"],
  ["medications/[id]/administer", "إعطاء دواء MAR"],
  ["inventory", "المخزون"],
  ["inventory/transactions", "حركة المخزون"],
  ["inventory/alerts", "تنبيهات المخزون"],
  ["canteen/inspections", "فحوص المقصف"],
  ["canteen/incidents", "بلاغات التسمم"],
  ["nurses/shifts", "المناوبات"],
  ["nurses/attendance", "حضور التمريض"],
  ["safety/first-aid", "حقائب الإسعاف"],
  ["safety/aed", "أجهزة AED"],
  ["safety/inspections", "فحوص السلامة"],
  ["psychology/sessions", "جلسات نفسية"],
  ["psychology/sessions/new", "جلسة جديدة"],
  ["social/cases", "حالات اجتماعية"],
  ["social/cases/new", "حالة جديدة"],
  ["internal-referrals", "تحويلات داخلية"],
  ["alerts/frequent", "طلاب مترددون"],
  ["circulars", "التعاميم"],
  ["circulars/new", "تعميم جديد"],
  ["notifications", "الإشعارات"],
  ["reports", "التقارير"],
  ["reports/medical", "تقارير طبية"],
  ["reports/employees", "تقارير موظفين"],
  ["reports/canteen", "تقارير مقصف"],
  ["reports/inventory", "تقارير مخزون"],
  ["search", "بحث متقدم"],
  ["qr-generator", "توليد QR"],
  ["qr-print", "طباعة بطاقات"],
  ["settings/users", "المستخدمون"],
  ["settings/clinics", "العيادات"],
  ["settings/profile", "الملف الشخصي"],
  ["print/canteen", "طباعة فحص مقصف"],
];

const template = (title, apiPath, resourceKey) => `"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";

export default function Page() {
  return (
    <AutoDataTable
      title="${title}"
      apiPath="${apiPath}"
      resourceKey="${resourceKey}"
    />
  );
}
`;

const apiMap = {
  students: "/api/v1/students",
  employees: "/api/v1/employees",
  visits: "/api/v1/visits",
  referrals: "/api/v1/referrals",
  emergency: "/api/v1/emergency",
  medications: "/api/v1/medications",
  inventory: "/api/v1/inventory",
  clinics: "/api/v1/settings/clinics",
  circulars: "/api/v1/circulars",
  notifications: "/api/v1/notifications",
  search: "/api/v1/search?q=",
  "psychology/sessions": "/api/v1/psychology/sessions",
  "social/cases": "/api/v1/social/cases",
  "internal-referrals": "/api/v1/internal-referrals",
  "alerts/frequent": "/api/v1/alerts/frequent",
  "canteen/inspections": "/api/v1/canteen/inspections",
  "canteen/incidents": "/api/v1/canteen/incidents",
};

for (const [route, title] of pages) {
  const dir = path.join(root, route);
  fs.mkdirSync(dir, { recursive: true });
  const base = route.split("/")[0];
  const key = route.includes("/") ? route.split("/").slice(0, 2).join("/") : base;
  const api = apiMap[key] ?? apiMap[base] ?? "/api/v1/health";
  fs.writeFileSync(path.join(dir, "page.tsx"), template(title, api, key));
}

console.log(`Scaffolded ${pages.length} pages`);
