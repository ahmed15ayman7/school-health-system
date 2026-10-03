"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowRight, Truck } from "lucide-react";

type Med = { id: string; name: string; mainStockQty?: number; unit?: string };

type Line = { medicationId: string; quantityRequested: string };

export default function StockRequestForm() {
  const router = useRouter();
  const [meds, setMeds] = useState<Med[]>([]);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ medicationId: "", quantityRequested: "" }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/medications")
      .then((r) => r.json())
      .then((j) => setMeds(j.data ?? []))
      .catch(() => toast.error("تعذّر تحميل الأدوية"));
  }, []);

  useEffect(() => {
    if (meds[0] && !lines[0]?.medicationId) {
      setLines([{ medicationId: meds[0].id, quantityRequested: "" }]);
    }
  }, [meds, lines]);

  function addLine() {
    setLines((prev) => [...prev, { medicationId: meds[0]?.id ?? "", quantityRequested: "" }]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payloadLines = lines
      .map((l) => ({
        medicationId: l.medicationId,
        quantityRequested: Number(l.quantityRequested),
      }))
      .filter((l) => l.medicationId && l.quantityRequested > 0);
    if (!payloadLines.length) {
      toast.error("أضف صنفاً واحداً على الأقل");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/v1/inventory/stock-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notes.trim() || undefined, lines: payloadLines }),
    });
    setLoading(false);
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error?.message ?? "فشل إرسال الطلب");
      return;
    }
    toast.success("تم إرسال الطلب للمخزن الرئيسي");
    router.push("/inventory/requests");
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 pb-8">
      <div className="rounded-2xl bg-gradient-to-l from-slate-800 to-primary p-5 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Truck className="h-6 w-6" aria-hidden />
              طلب مخزون داخلي
            </h2>
            <p className="mt-2 text-sm font-semibold text-white/85">
              يُرسل الطلب من عيادتك إلى المخزن الرئيسي. بعد الموافقة، الصيدلية تنفّذ التحويل إلى مخزون
              العيادة الفرعي.
            </p>
          </div>
          <Link href="/inventory/requests">
            <Button type="button" variant="outline" size="sm" className="border-white/40 bg-white/10 text-white">
              <ArrowRight className="h-4 w-4" aria-hidden />
              الطلبات
            </Button>
          </Link>
        </div>
      </div>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
        {lines.map((line, idx) => (
          <div key={idx} className="grid gap-2 rounded-xl border border-border/80 bg-slate-50/80 p-3 sm:grid-cols-[1fr_120px]">
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">الدواء</label>
              <select
                className="w-full rounded-xl border border-border px-3 py-2 text-sm font-bold"
                value={line.medicationId}
                onChange={(e) =>
                  setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, medicationId: e.target.value } : l)))
                }
              >
                {meds.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (رئيسي: {m.mainStockQty ?? 0})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted">الكمية</label>
              <Input
                type="number"
                min={1}
                value={line.quantityRequested}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l, i) => (i === idx ? { ...l, quantityRequested: e.target.value } : l)),
                  )
                }
                required
              />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addLine}>
          + صنف آخر
        </Button>
        <div>
          <label className="mb-1 block text-xs font-bold text-muted">ملاحظات</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اختياري..." />
        </div>
      </section>

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "جاري الإرسال..." : "إرسال الطلب"}
      </Button>
    </form>
  );
}
