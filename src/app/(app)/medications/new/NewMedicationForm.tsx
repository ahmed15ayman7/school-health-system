"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowRight, Pill } from "lucide-react";

export default function NewMedicationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [activeIngredient, setActiveIngredient] = useState("");
  const [dosageForm, setDosageForm] = useState("");
  const [concentration, setConcentration] = useState("");
  const [unit, setUnit] = useState("tablet");
  const [minQuantity, setMinQuantity] = useState("10");
  const [supplier, setSupplier] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("اسم الدواء مطلوب");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/v1/medications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        activeIngredient: activeIngredient.trim() || undefined,
        dosageForm: dosageForm.trim() || undefined,
        concentration: concentration.trim() || undefined,
        unit: unit.trim() || undefined,
        minQuantity: Number(minQuantity) || 0,
        supplier: supplier.trim() || undefined,
        storageLocation: storageLocation.trim() || undefined,
      }),
    });
    setLoading(false);
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error?.message ?? "فشل الحفظ");
      return;
    }
    toast.success("تم تعريف الدواء — استلم الكمية في المخزن الرئيسي");
    router.push("/inventory/receive");
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 pb-8">
      <div className="rounded-2xl bg-gradient-to-l from-[#0e2350] to-[#2563eb] p-5 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-white/70">دليل الأدوية</p>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-black">
              <Pill className="h-6 w-6" aria-hidden />
              تعريف دواء جديد
            </h2>
            <p className="mt-2 text-sm font-semibold text-white/85">
              التعريف للدليل المركزي. الكميات تُستلم في المخزن الرئيسي ثم تُحوَّل للعيادات بطلب
              داخلي.
            </p>
          </div>
          <Link href="/medications">
            <Button type="button" variant="outline" size="sm" className="border-white/40 bg-white/10 text-white">
              <ArrowRight className="h-4 w-4" aria-hidden />
              قائمة الأدوية
            </Button>
          </Link>
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted">اسم الدواء *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: باراسيتامول 500mg" required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">المادة الفعّالة</label>
            <Input value={activeIngredient} onChange={(e) => setActiveIngredient(e.target.value)} placeholder="Paracetamol" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">الشكل الدوائي</label>
            <Input value={dosageForm} onChange={(e) => setDosageForm(e.target.value)} placeholder="أقراص / شراب" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">التركيز</label>
            <Input value={concentration} onChange={(e) => setConcentration(e.target.value)} placeholder="500mg" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">وحدة الصرف</label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="tablet" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">حد إعادة الطلب (للعيادة)</label>
            <Input type="number" min={0} value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">مكان التخزين (رئيسي)</label>
            <Input value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} placeholder="خزانة A" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted">المورد (اختياري)</label>
          <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} />
        </div>
      </section>

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "جاري الحفظ..." : "حفظ تعريف الدواء"}
      </Button>
    </form>
  );
}
