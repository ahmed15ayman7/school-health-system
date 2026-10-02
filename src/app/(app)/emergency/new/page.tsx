"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StudentPicker } from "@/components/shared/StudentPicker";
import { toast } from "sonner";

export default function EmergencyNewPage() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [student, setStudent] = useState<{ id: string; name: string; academicNumber: string } | null>(null);
  const [responseLevel, setResponseLevel] = useState("CONSCIOUS");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;
    setLoading(true);
    let key = sessionStorage.getItem("emg-idem");
    if (!key) {
      key = crypto.randomUUID();
      sessionStorage.setItem("emg-idem", key);
    }
    const res = await fetch("/api/v1/emergency", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify({
        location,
        visitorType: "STUDENT",
        visitorId: student.id,
        responseLevel,
        notes,
        referralDecision: false,
      }),
    });
    setLoading(false);
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error?.message ?? "فشل التسجيل");
      return;
    }
    sessionStorage.removeItem("emg-idem");
    toast.success(`تم تسجيل ${j.data?.caseNumber ?? "الحالة"}`);
    router.push("/emergency");
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-4 rounded-2xl border-2 border-red-200 bg-card p-6">
      <h2 className="text-xl font-black text-red-700">تسجيل حالة طارئة</h2>
      <label className="block text-xs font-extrabold">
        الموقع
        <input
          required
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </label>
      <StudentPicker value={student} onSelect={setStudent} />
      <label className="block text-xs font-extrabold">
        مستوى الاستجابة
        <select
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={responseLevel}
          onChange={(e) => setResponseLevel(e.target.value)}
        >
          <option value="CONSCIOUS">واعي</option>
          <option value="RESPONDS_TO_PAIN">يستجيب للألم</option>
          <option value="UNRESPONSIVE">غير مستجيب</option>
        </select>
      </label>
      <textarea
        className="w-full rounded-xl border border-border p-3 text-sm"
        placeholder="ملاحظات / تدخلات"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <Button type="submit" variant="danger" disabled={loading || !student} className="w-full">
        {loading ? "جاري التسجيل..." : "تسجيل الطوارئ"}
      </Button>
    </form>
  );
}
