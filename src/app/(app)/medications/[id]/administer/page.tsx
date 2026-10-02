"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StudentPicker } from "@/components/shared/StudentPicker";
import { toast } from "sonner";

export default function AdministerMedicationPage() {
  const { id: medicationId } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<{ id: string; name: string; academicNumber: string } | null>(null);
  const [dose, setDose] = useState("1");
  const [unit, setUnit] = useState("tablet");
  const [override, setOverride] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;
    const res = await fetch(`/api/v1/medications/${medicationId}/administer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorType: "STUDENT",
        visitorId: student.id,
        medicationId,
        dose: Number(dose),
        unit,
        allergyOverride: override,
        reason: override ? "تجاوز طبي موثّق" : undefined,
      }),
    });
    const j = await res.json();
    if (!res.ok) {
      if (j.error?.code === "ALLERGY_CONFLICT") {
        toast.error("تعارض حساسية — فعّل التجاوز إن لزم");
        return;
      }
      toast.error(j.error?.message ?? "فشل");
      return;
    }
    toast.success("تم تسجيل MAR");
    router.push("/medications");
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-xl font-black text-primary">إعطاء دواء (MAR)</h2>
      <StudentPicker value={student} onSelect={setStudent} />
      <label className="block text-xs font-extrabold">
        الجرعة
        <input
          type="number"
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={dose}
          onChange={(e) => setDose(e.target.value)}
        />
      </label>
      <label className="block text-xs font-extrabold">
        الوحدة
        <input
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />
      </label>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
        تجاوز تحذير الحساسية (يتطلب صلاحية وتوثيق)
      </label>
      <Button type="submit" disabled={!student} className="w-full">
        تسجيل الإعطاء
      </Button>
    </form>
  );
}
