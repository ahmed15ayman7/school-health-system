"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const ITEMS = [
  "قلة اهتمام أو متعة في فعل الأشياء",
  "الشعور بالحزن أو الاكتئاب أو اليأس",
  "صعوبة في النوم أو النوم الزائد",
  "تعب أو قلة طاقة",
  "ضعف الشهية أو الإفراط في الأكل",
  "شعور سيء تجاه نفسك",
  "صعوبة التركيز",
  "بطء الحركة أو العصبية",
  "أفكار إيذاء النفس",
];

export function PHQ9Form({ sessionId, onSaved }: { sessionId: string; onSaved?: () => void }) {
  const [scores, setScores] = useState<number[]>(() => ITEMS.map(() => 0));
  const [loading, setLoading] = useState(false);
  const total = scores.reduce((a, b) => a + b, 0);

  async function save() {
    setLoading(true);
    const res = await fetch("/api/v1/psychology/sessions/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        tool: "PHQ9",
        score: total,
        responsesJson: { items: ITEMS.map((label, i) => ({ label, score: scores[i] })) },
      }),
    });
    setLoading(false);
    if (res.ok) onSaved?.();
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <h3 className="font-black text-primary">مقياس PHQ-9</h3>
      {ITEMS.map((label, i) => (
        <label key={label} className="block text-xs font-bold">
          {label}
          <select
            className="mt-1 w-full rounded-lg border border-border px-2 py-1 text-sm"
            value={scores[i]}
            onChange={(e) => {
              const v = Number(e.target.value);
              setScores((prev) => prev.map((x, j) => (j === i ? v : x)));
            }}
          >
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      ))}
      <p className="text-sm font-bold">المجموع: {total}</p>
      <Button type="button" disabled={loading} onClick={save}>
        حفظ التقييم
      </Button>
    </div>
  );
}
