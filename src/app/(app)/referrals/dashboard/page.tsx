"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/shared/StatCard";
import { ReferralStatusBadge } from "@/components/shared/StatusBadge";
import { TimerBox } from "@/components/shared/TimerBox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Ref = {
  id: string;
  referralNumber: string;
  status: string;
  referralTime: string;
  student: { name: string; academicNumber: string };
};

export default function ReferralsDashboardPage() {
  const [stats, setStats] = useState({ pending: 0, late: 0, avgWaitingMinutes: 0, avgTreatmentMinutes: 0 });
  const [refs, setRefs] = useState<Ref[]>([]);

  const load = useCallback(() => {
    fetch("/api/v1/referrals/stats")
      .then((r) => r.json())
      .then((j) => setStats(j.data ?? stats));
    fetch("/api/v1/referrals?pageSize=50")
      .then((r) => r.json())
      .then((j) => setRefs(j.data ?? []));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const columns: { key: string; title: string; filter: (r: Ref) => boolean }[] = [
    { key: "PENDING", title: "قيد الانتظار", filter: (r) => r.status === "PENDING" },
    { key: "RECEIVED", title: "تم الاستقبال", filter: (r) => r.status === "RECEIVED" },
    { key: "IN_TREATMENT", title: "قيد العلاج", filter: (r) => r.status === "IN_TREATMENT" },
    { key: "COMPLETED", title: "منتهية اليوم", filter: (r) => r.status === "COMPLETED" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-primary">لوحة تتبع التحويلات</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="معلّقة" value={stats.pending} icon="⏳" tone="orange" />
        <StatCard label="متأخرة >15د" value={stats.late} icon="🔴" tone="red" />
        <StatCard label="متوسط انتظار (د)" value={stats.avgWaitingMinutes} icon="📊" tone="blue" />
        <StatCard label="متوسط علاج (د)" value={stats.avgTreatmentMinutes} icon="📊" tone="teal" />
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        {columns.map((col) => (
          <Card key={col.key}>
            <CardHeader>
              <h3 className="text-sm font-black text-primary">{col.title}</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {refs.filter(col.filter).map((r) => (
                <Link
                  key={r.id}
                  href={`/referrals/${r.id}`}
                  className="block rounded-xl border border-border p-3 hover:border-accent/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black">{r.student.name}</span>
                    <ReferralStatusBadge referral={r} />
                  </div>
                  <p className="text-[10px] font-bold text-muted">{r.referralNumber}</p>
                  {r.status === "PENDING" && <TimerBox since={r.referralTime} label="منذ التحويل" />}
                  {r.status === "RECEIVED" && <TimerBox since={r.referralTime} label="منذ الاستقبال" />}
                </Link>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
