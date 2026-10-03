"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CENTRAL_ROLES } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";
import { toast } from "sonner";
import { ArrowRight, Pill } from "lucide-react";

type ClinicOpt = { id: string; name: string; code?: string };

export default function NewMedicationForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;
  const userClinicId = session?.user?.clinicId ?? null;
  const isCentral = role != null && CENTRAL_ROLES.includes(role);

  const [clinics, setClinics] = useState<ClinicOpt[]>([]);
  const [clinicId, setClinicId] = useState("");
  const [name, setName] = useState("");
  const [activeIngredient, setActiveIngredient] = useState("");
  const [dosageForm, setDosageForm] = useState("");
  const [concentration, setConcentration] = useState("");
  const [unit, setUnit] = useState("tablet");
  const [minQuantity, setMinQuantity] = useState("10");
  const [supplier, setSupplier] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isCentral) {
      if (userClinicId) setClinicId(userClinicId);
      return;
    }
    fetch("/api/v1/medications/clinic-options")
      .then((r) => r.json())
      .then((j) => {
        const list = (j.data ?? []) as ClinicOpt[];
        setClinics(list);
        if (list[0]) setClinicId(list[0].id);
      })
      .catch(() => toast.error("تعذّر تحميل العيادات"));
  }, [isCentral, userClinicId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const targetClinic = isCentral ? clinicId : userClinicId;
    if (!targetClinic) {
      toast.error("حدّد العيادة");
      return;
    }
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
        clinicId: targetClinic,
      }),
    });
    setLoading(false);
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error?.message ?? "فشل الحفظ");
      return;
    }
    toast.success("تم تعريف الدواء — يمكنك استلام دفعة مخزون الآن");
    router.push("/inventory/receive");
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 pb-8">
      <div className="rounded-2xl bg-gradient-to-l from-[#0e2350] to-[#2563eb] p-5 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-white/70">مخزون العيادة</p>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-black">
              <Pill className="h-6 w-6" aria-hidden />
              تعريف دواء جديد
            </h2>
            <p className="mt-2 text-sm font-semibold text-white/85">
              كل دواء مربوط بعيادة واحدة. بعد التعريف، استلم كمية من صفحة «استلام مخزون».
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
        {isCentral ? (
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">العيادة</label>
            <select
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm font-bold"
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              required
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.code ? ` (${c.code})` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-muted">
            يُسجَّل الدواء في مخزون عيادتك الحالية فقط.
          </p>
        )}

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
            <label className="mb-1.5 block text-xs font-bold text-muted">حد إعادة الطلب</label>
            <Input type="number" min={0} value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">مكان التخزين في العيادة</label>
            <Input value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} placeholder="خزانة A / رف 2" />
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
