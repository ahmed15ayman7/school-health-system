"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { VisitStatusBadge } from "@/components/shared/StatusBadge";
import { VitalSignsForm, parseVitals, type VitalFields } from "@/components/shared/VitalSignsForm";
import { toast } from "sonner";

export default function VisitDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [visit, setVisit] = useState<Record<string, unknown> | null>(null);
  const [vitals, setVitals] = useState<VitalFields>({});
  const [outcome, setOutcome] = useState("TREAT_AND_RETURN");
  const [recommendations, setRecommendations] = useState("");

  const load = () =>
    fetch(`/api/v1/visits/${id}`)
      .then((r) => r.json())
      .then((j) => {
        setVisit(j.data);
        const vs = j.data?.vitalSigns;
        if (vs) {
          setVitals({
            temperature: vs.temperature?.toString(),
            bloodPressureSystolic: vs.bloodPressureSystolic?.toString(),
            bloodPressureDiastolic: vs.bloodPressureDiastolic?.toString(),
            pulse: vs.pulse?.toString(),
            respirationRate: vs.respirationRate?.toString(),
            spo2: vs.spo2?.toString(),
            bloodSugar: vs.bloodSugar?.toString(),
            weight: vs.weight?.toString(),
            height: vs.height?.toString(),
          });
        }
      });

  useEffect(() => {
    load();
  }, [id]);

  async function saveVitals() {
    const res = await fetch(`/api/v1/visits/${id}/vitals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parseVitals(vitals)),
    });
    if (res.ok) toast.success("تم حفظ العلامات");
    else toast.error("فشل الحفظ");
  }

  async function closeVisit() {
    const res = await fetch(`/api/v1/visits/${id}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome, recommendations }),
    });
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error?.message ?? "فشل الإغلاق");
      return;
    }
    toast.success("تم إغلاق الزيارة");
    router.refresh();
    load();
  }

  if (!visit) return <p className="text-sm font-bold text-muted">جاري التحميل...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-black text-primary">{String(visit.visitNumber)}</h2>
          <p className="text-sm font-bold text-muted">{String(visit.visitorName ?? "")}</p>
        </div>
        <VisitStatusBadge status={String(visit.status)} />
      </div>
      {visit.status === "OPEN" && (
        <>
          <section className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-2 font-black">العلامات الحيوية</h3>
            <VitalSignsForm values={vitals} onChange={setVitals} />
            <Button type="button" className="mt-3" size="sm" onClick={saveVitals}>
              حفظ العلامات
            </Button>
          </section>
          <section className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-2 font-black">إغلاق الزيارة</h3>
            <select
              className="w-full rounded-xl border border-border px-3 py-2 text-sm font-bold"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            >
              <option value="TREAT_AND_RETURN">علاج والعودة للفصل</option>
              <option value="OBSERVE_IN_CLINIC">مراقبة بالعيادة</option>
              <option value="SENT_HOME">العودة للمنزل</option>
              <option value="GUARDIAN_PICKUP">استلام ولي الأمر</option>
              <option value="DOCTOR_REFERRAL">إحالة طبيب</option>
              <option value="HOSPITAL_REFERRAL">إحالة مستشفى</option>
              <option value="AMBULANCE">إسعاف</option>
              <option value="EMERGENCY">طوارئ</option>
              <option value="FOLLOW_UP">متابعة</option>
            </select>
            <textarea
              className="mt-2 w-full rounded-xl border border-border p-3 text-sm"
              placeholder="التوصيات"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
            />
            <Button type="button" variant="primary" className="mt-3 w-full" onClick={closeVisit}>
              إغلاق الزيارة
            </Button>
          </section>
        </>
      )}
    </div>
  );
}
