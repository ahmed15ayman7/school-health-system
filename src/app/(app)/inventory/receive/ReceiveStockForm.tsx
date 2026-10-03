"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowRight, PackagePlus } from "lucide-react";

type MedOpt = { id: string; name: string; stockQty?: number; clinicName?: string };

export default function ReceiveStockForm() {
  const router = useRouter();
  const [meds, setMeds] = useState<MedOpt[]>([]);
  const [medicationId, setMedicationId] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/medications")
      .then((r) => r.json())
      .then((j) => {
        const list = (j.data ?? []) as MedOpt[];
        setMeds(list);
        if (list[0]) setMedicationId(list[0].id);
      })
      .catch(() => toast.error("تعذّر تحميل الأدوية"));
  }, []);

  const selected = meds.find((m) => m.id === medicationId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!medicationId) {
      toast.error("اختر الدواء");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/v1/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medicationId,
        batchNumber: batchNumber.trim(),
        quantity: Number(quantity),
        expiryDate,
        notes: notes.trim() || undefined,
      }),
    });
    setLoading(false);
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error?.message ?? "فشل الاستلام");
      return;
    }
    toast.success("تمت إضافة الدفعة للمخزون");
    router.push("/inventory");
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 pb-8">
      <div className="rounded-2xl bg-gradient-to-l from-teal-800 to-accent-dark p-5 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-white/70">إدخال مخزون</p>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-black">
              <PackagePlus className="h-6 w-6" aria-hidden />
              استلام للمخزن الرئيسي
            </h2>
            <p className="mt-2 text-sm font-semibold text-white/85">
              تُضاف الكمية للمخزن المركزي فقط. العيادات تطلب التحويل عبر «طلب مخزون داخلي».
            </p>
          </div>
          <Link href="/inventory">
            <Button type="button" variant="outline" size="sm" className="border-white/40 bg-white/10 text-white">
              <ArrowRight className="h-4 w-4" aria-hidden />
              المخزون
            </Button>
          </Link>
        </div>
      </div>

      {meds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
          <p className="text-sm font-bold text-muted">لا توجد أدوية معرّفة لعيادتك بعد.</p>
          <Link href="/medications/new" className="mt-3 inline-block">
            <Button type="button" size="sm">
              + تعريف دواء أولاً
            </Button>
          </Link>
        </div>
      ) : (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">الدواء *</label>
            <select
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm font-bold"
              value={medicationId}
              onChange={(e) => setMedicationId(e.target.value)}
              required
            >
              {meds.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.clinicName ? ` — ${m.clinicName}` : ""}
                  {m.stockQty != null ? ` (رصيد: ${m.stockQty})` : ""}
                </option>
              ))}
            </select>
            {selected && (
              <p className="mt-1 text-[11px] font-bold text-muted">
                الرصيد الحالي: {selected.stockQty ?? 0}
              </p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted">رقم الدفعة *</label>
              <Input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="BATCH-2026-01" required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted">الكمية *</label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">تاريخ انتهاء الصلاحية *</label>
            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">ملاحظات</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="فاتورة / مورد..." />
          </div>
        </section>
      )}

      <Button type="submit" disabled={loading || meds.length === 0} className="w-full" size="lg">
        {loading ? "جاري التسجيل..." : "تسجيل استلام المخزون"}
      </Button>
    </form>
  );
}
