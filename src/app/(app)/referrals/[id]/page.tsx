"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ReferralStatusBadge } from "@/components/shared/StatusBadge";
import { TimerBox } from "@/components/shared/TimerBox";
import { toast } from "sonner";

export default function ReferralDetailPage() {
  const { id } = useParams();
  const [ref, setRef] = useState<Record<string, unknown> | null>(null);
  const [outcome, setOutcome] = useState("TREAT_AND_RETURN");

  const load = () =>
    fetch(`/api/v1/referrals/${id}`)
      .then((r) => r.json())
      .then((j) => setRef(j.data));

  useEffect(() => {
    load();
  }, [id]);

  async function action(path: string, body?: object) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (path.includes("receive")) headers["Idempotency-Key"] = crypto.randomUUID();
    const res = await fetch(`/api/v1/referrals/${id}/${path}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : "{}",
    });
    const j = await res.json();
    if (!res.ok) toast.error(j.error?.message ?? "فشل");
    else {
      toast.success("تم");
      load();
    }
  }

  if (!ref) return <p className="text-sm text-muted">جاري التحميل...</p>;
  const student = ref.student as { name?: string; academicNumber?: string };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-primary">{String(ref.referralNumber)}</h2>
        <ReferralStatusBadge referral={{ status: String(ref.status), referralTime: String(ref.referralTime) }} />
      </div>
      <p className="font-bold">{student?.name} — {student?.academicNumber}</p>
      {ref.status === "PENDING" && <TimerBox since={String(ref.referralTime)} />}
      <div className="flex flex-wrap gap-2">
        {ref.status === "PENDING" && (
          <Button type="button" onClick={() => action("receive")}>
            استقبال التحويل
          </Button>
        )}
        {ref.status === "RECEIVED" && (
          <Button type="button" onClick={() => action("start-treatment")}>
            بدء العلاج
          </Button>
        )}
        {ref.status === "IN_TREATMENT" && (
          <>
            <select
              className="rounded-xl border border-border px-3 py-2 text-sm font-bold"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            >
              <option value="TREAT_AND_RETURN">علاج والعودة للفصل</option>
              <option value="SENT_HOME">العودة للمنزل</option>
              <option value="GUARDIAN_PICKUP">استلام ولي الأمر</option>
              <option value="HOSPITAL_REFERRAL">إحالة مستشفى</option>
              <option value="EMERGENCY">طوارئ</option>
            </select>
            <Button
              type="button"
              onClick={() =>
                action("complete", {
                  outcome,
                  diagnosis: "",
                  procedure: "",
                  recommendations: "",
                })
              }
            >
              إنهاء التحويل
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
