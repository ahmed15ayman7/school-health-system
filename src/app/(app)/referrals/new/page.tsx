"use client";

import { Button } from "@/components/ui/button";
import { StudentPicker } from "@/components/shared/StudentPicker";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewReferralPage() {
  const router = useRouter();
  const [student, setStudent] = useState<{ id: string; name: string; academicNumber: string } | null>(null);
  const [reasonDetails, setReasonDetails] = useState("");
  const [reasonCategory, setReasonCategory] = useState("SYMPTOMS");
  const [severity, setSeverity] = useState("NORMAL");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;
    setLoading(true);
    const res = await fetch("/api/v1/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: student.id, reasonCategory, reasonDetails, severity }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/referrals/dashboard");
      router.refresh();
    } else {
      const j = await res.json();
      toast.error(j.error?.message ?? "فشل التحويل");
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-xl font-black text-primary">تحويل طالب للعيادة</h2>
      <StudentPicker value={student} onSelect={setStudent} />
      <label className="block text-xs font-extrabold text-primary">
        فئة السبب
        <select
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm font-semibold"
          value={reasonCategory}
          onChange={(e) => setReasonCategory(e.target.value)}
        >
          <option value="SYMPTOMS">أعراض</option>
          <option value="INJURY">إصابة</option>
          <option value="EMERGENCY">طارئ</option>
          <option value="CHRONIC_FOLLOWUP">متابعة مزمن</option>
          <option value="SCHEDULED_MEDICATION">دواء مجدول</option>
          <option value="GENERAL_COMPLAINT">شكوى عامة</option>
          <option value="OTHER">أخرى</option>
        </select>
      </label>
      <label className="block text-xs font-extrabold text-primary">
        التفاصيل
        <textarea
          required
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={reasonDetails}
          onChange={(e) => setReasonDetails(e.target.value)}
        />
      </label>
      <label className="block text-xs font-extrabold text-primary">
        الخطورة
        <select
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        >
          <option value="NORMAL">عادي</option>
          <option value="URGENT">عاجل</option>
          <option value="EMERGENCY">طارئ</option>
        </select>
      </label>
      <Button type="submit" disabled={loading || !student} className="w-full">
        {loading ? "جاري الإرسال..." : "إرسال التحويل"}
      </Button>
    </form>
  );
}
