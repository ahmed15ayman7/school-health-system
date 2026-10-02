"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewReferralPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [reasonDetails, setReasonDetails] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/v1/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        reasonCategory: "SYMPTOMS",
        reasonDetails,
        severity: "NORMAL",
      }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/referrals");
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-xl font-black text-primary">تحويل طالب للعيادة</h2>
      <label className="block text-xs font-extrabold text-primary">
        معرّف الطالب (UUID)
        <input
          required
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
      </label>
      <label className="block text-xs font-extrabold text-primary">
        تفاصيل السبب
        <textarea
          required
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={reasonDetails}
          onChange={(e) => setReasonDetails(e.target.value)}
        />
      </label>
      <Button type="submit" disabled={loading}>
        {loading ? "جاري الإرسال..." : "إنشاء تحويل REF"}
      </Button>
    </form>
  );
}
