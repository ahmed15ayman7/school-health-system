"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StudentPicker } from "@/components/shared/StudentPicker";
import { GAD7Form } from "@/components/psychology/GAD7Form";
import { PHQ9Form } from "@/components/psychology/PHQ9Form";
import { toast } from "sonner";

export default function Page() {
  const [student, setStudent] = useState<{ id: string; name: string; academicNumber: string } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function createSession() {
    if (!student) return;
    setLoading(true);
    const res = await fetch("/api/v1/psychology/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: student.id,
        sessionType: "INDIVIDUAL",
        sessionDate: new Date().toISOString().slice(0, 10),
        chiefComplaint: "جلسة تقييم",
      }),
    });
    setLoading(false);
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error?.message ?? "فشل إنشاء الجلسة");
      return;
    }
    setSessionId(j.data.id);
    toast.success("تم إنشاء الجلسة — أكمل المقياس");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-xl font-black text-primary">جلسة نفسية جديدة</h2>
      {!sessionId && (
        <>
          <StudentPicker value={student} onSelect={setStudent} />
          <Button disabled={!student || loading} onClick={createSession}>
            {loading ? "..." : "إنشاء الجلسة"}
          </Button>
        </>
      )}
      {sessionId && (
        <>
          <GAD7Form sessionId={sessionId} />
          <PHQ9Form sessionId={sessionId} />
        </>
      )}
    </div>
  );
}
