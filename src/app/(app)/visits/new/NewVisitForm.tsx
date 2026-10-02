"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StudentPicker } from "@/components/shared/StudentPicker";
import { VitalSignsForm, parseVitals, type VitalFields } from "@/components/shared/VitalSignsForm";
import { toast } from "sonner";

const REASONS = [
  "PAIN", "INJURY", "FEVER", "HEADACHE", "ABDOMINAL_PAIN", "VOMITING", "DIARRHEA", "ALLERGY",
  "DIZZINESS", "DYSPNEA", "RESPIRATORY", "PSYCHOLOGICAL", "CHRONIC_FOLLOWUP", "MEDICATION_ADMIN",
  "ROUTINE_CHECK", "OTHER",
] as const;

export default function NewVisitForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { data: session } = useSession();
  const [student, setStudent] = useState<{ id: string; name: string; academicNumber: string; clinicId?: string } | null>(null);
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
        .then((j) => j.data && setStudent(j.data))
        .catch(() => undefined);
    }
  }, [search]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!student?.clinicId && !session?.user?.clinicId) {
      toast.error("لا توجد عيادة مرتبطة");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/v1/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinicId: student?.clinicId ?? session!.user!.clinicId,
        visitorType: "STUDENT",
        visitorId: student!.id,
        reasonList,
        otherReason,
        triageLevel,
        triageReason,
        vitals: parseVitals(vitals),
      }),
    });
    setLoading(false);
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error?.message ?? "فشل الحفظ");
      return;
    }
    router.push(`/visits/${j.data.id}`);
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-xl font-black text-primary">زيارة جديدة</h2>
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-2 font-black text-primary">الطالب</h3>
        <StudentPicker value={student} onSelect={setStudent} />
      </section>
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-2 font-black text-primary">سبب الزيارة</h3>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <label key={r} className="flex items-center gap-1 text-xs font-bold">
              <input
                type="checkbox"
                checked={reasonList.includes(r)}
                onChange={(e) =>
                  setReasonList((prev) => (e.target.checked ? [...prev, r] : prev.filter((x) => x !== r)))
                }
              />
              {r}
            </label>
          ))}
        </div>
        <input
          className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
          placeholder="تفاصيل أخرى..."
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
          placeholder="سبب التصنيف"
          value={triageReason}
          onChange={(e) => setTriageReason(e.target.value)}
        />
      </section>
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-2 font-black text-primary">العلامات الحيوية</h3>
        <VitalSignsForm values={vitals} onChange={setVitals} />
      </section>
      <Button type="submit" disabled={loading || !student} className="w-full">
        {loading ? "جاري الحفظ..." : "فتح الزيارة"}
      </Button>
    </form>
  );
}
