"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StatCard } from "@/components/shared/StatCard";
import Link from "next/link";

export default function ClinicDashboardPage() {
  const { id } = useParams();
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/v1/clinics/${id}/dashboard`)
      .then((r) => r.json())
      .then((j) => setData(j.data));
  }, [id]);

  if (!data) return <p className="text-sm font-bold text-muted">جاري التحميل...</p>;
  const clinic = data.clinic as { name: string };
  const today = data.today as Record<string, number>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-primary">لوحة {clinic.name}</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="زيارات مفتوحة" value={today.visitsOpen ?? 0} icon="🩺" tone="blue" />
        <StatCard label="زيارات مغلقة اليوم" value={today.visitsClosed ?? 0} icon="✅" tone="teal" />
        <StatCard label="طوارئ اليوم" value={today.emergencies ?? 0} icon="🚨" tone="red" />
        <StatCard label="تحويلات معلّقة" value={today.referralsPending ?? 0} icon="⏳" tone="orange" />
        <StatCard label="تحويلات متأخرة" value={today.referralsLate ?? 0} icon="🔴" tone="red" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-2 font-black">آخر الزيارات</h3>
        <ul className="space-y-1 text-sm font-bold">
          {((data.recentVisits as { id: string; visitNumber: string; status: string }[]) ?? []).map((v) => (
            <li key={v.id}>
              <Link href={`/visits/${v.id}`} className="text-accent hover:underline">
                {v.visitNumber}
              </Link>{" "}
              — {v.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
