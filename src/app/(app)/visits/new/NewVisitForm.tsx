"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StudentPicker } from "@/components/shared/StudentPicker";
import { VitalSignsForm, parseVitals, type VitalFields } from "@/components/shared/VitalSignsForm";
import { VISIT_REASON_LABELS } from "@/lib/visit-reasons";
import { toast } from "sonner";

const REASONS = Object.keys(VISIT_REASON_LABELS) as (keyof typeof VISIT_REASON_LABELS)[];

type Props = {
  /** عيادة افتراضية للمستخدم (ممرض) — المدير يعتمد عيادة الطالب */
  defaultClinicId?: string | null;
};

function cleanVitalsPayload(values: VitalFields) {
  const raw = parseVitals(values);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && !Number.isNaN(v)) out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

export default function NewVisitForm({ defaultClinicId }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const [student, setStudent] = useState<{
    id: string;
    name: string;
    academicNumber: string;
    clinicId?: string;
  } | null>(null);
  const [reasonList, setReasonList] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");
  const [triageLevel, setTriageLevel] = useState("LOW");
  const [triageReason, setTriageReason] = useState("");
  const [vitals, setVitals] = useState<VitalFields>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sid = search.get("studentId");
    if (sid) {
      fetch(`/api/v1/students/${sid}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.data) setStudent(j.data);
          else toast.error(j.error?.message ?? "تعذّر تحميل الطالب");
        })
        .catch(() => toast.error("تعذّر تحميل الطالب"));
    }
  }, [search]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!student) {
      toast.error("اختر الطالب أولاً");
      return;
    }
    const clinicId = student.clinicId ?? defaultClinicId;
    if (!clinicId) {
      toast.error("لا توجد عيادة مرتبطة بالطالب أو بالمستخدم");
      return;
    }
    if (reasonList.length === 0 && !otherReason.trim()) {
      toast.error("حدّد سبباً واحداً على الأقل");
      return;
    }

    setLoading(true);
    const payload: Record<string, unknown> = {
      clinicId,
      visitorType: "STUDENT",
      visitorId: student.id,
      reasonList,
      otherReason,
      triageLevel,
      triageReason: triageReason || undefined,
    };
    const vitalsPayload = cleanVitalsPayload(vitals);
    if (vitalsPayload) payload.vitals = vitalsPayload;

    const res = await fetch("/api/v1/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error?.message ?? "فشل الحفظ");
      return;
    }
    toast.success("تم فتح الزيارة");
    router.push(`/visits/${j.data.id}`);
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-black text-primary">تسجيل زيارة عيادة</h2>
          <p className="text-xs font-bold text-muted">من الملف الطلابي أو من سجل الزيارات — تُسجّل في سجل الزيارات والملف المرضي</p>
        </div>
        <Link href="/visits">
          <Button type="button" variant="outline" size="sm">
            رجوع للسجل
          </Button>
        </Link>
      </div>
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-2 font-black text-primary">الطالب</h3>
        <StudentPicker value={student} onSelect={setStudent} />
      </section>
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-2 font-black text-primary">سبب الزيارة</h3>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <label
              key={r}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs font-bold has-[:checked]:border-accent-2 has-[:checked]:bg-accent/5"
            >
              <input
                type="checkbox"
                checked={reasonList.includes(r)}
                onChange={(e) =>
                  setReasonList((prev) => (e.target.checked ? [...prev, r] : prev.filter((x) => x !== r)))
                }
              />
              {VISIT_REASON_LABELS[r]}
            </label>
          ))}
        </div>
        <input
          className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
          placeholder="تفاصيل إضافية..."
          value={otherReason}
          onChange={(e) => setOtherReason(e.target.value)}
        />
      </section>
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-2 font-black text-primary">الفرز</h3>
        <select
          className="w-full rounded-xl border border-border px-3 py-2 text-sm font-bold"
          value={triageLevel}
          onChange={(e) => setTriageLevel(e.target.value)}
        >
          <option value="LOW">منخفض</option>
          <option value="MEDIUM">متوسط</option>
          <option value="HIGH">عالي</option>
          <option value="EMERGENCY">طارئ</option>
        </select>
        <input
          className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
          placeholder="سبب التصنيف (اختياري)"
          value={triageReason}
          onChange={(e) => setTriageReason(e.target.value)}
        />
      </section>
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-2 font-black text-primary">العلامات الحيوية (اختياري)</h3>
        <VitalSignsForm values={vitals} onChange={setVitals} />
      </section>
      <Button type="submit" disabled={loading || !student} className="w-full">
        {loading ? "جاري الحفظ..." : "فتح الزيارة"}
      </Button>
    </form>
  );
}
