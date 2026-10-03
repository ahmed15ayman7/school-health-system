"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StudentPicker } from "@/components/shared/StudentPicker";
import { VitalSignsForm, parseVitals, type VitalFields } from "@/components/shared/VitalSignsForm";
import { VISIT_REASON_LABELS } from "@/lib/visit-reasons";
import { toast } from "sonner";
import { ArrowRight, ClipboardList, HeartPulse, Stethoscope, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const REASONS = Object.keys(VISIT_REASON_LABELS) as (keyof typeof VISIT_REASON_LABELS)[];

const TRIAGE_STYLES: Record<string, string> = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-800",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-900",
  HIGH: "border-orange-200 bg-orange-50 text-orange-900",
  EMERGENCY: "border-red-300 bg-red-50 text-red-800",
};

type Props = {
  defaultClinicId?: string | null;
};

function cleanVitalsPayload(values: VitalFields) {
  const raw = parseVitals(values);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && !Number.isNaN(v)) out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

function FormSection({
  step,
  title,
  icon: Icon,
  children,
  className,
}: {
  step: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-visible rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
          {step}
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden />
          <h3 className="text-base font-black text-primary">{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function NewVisitForm({ defaultClinicId }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const [student, setStudent] = useState<{
    id: string;
    name: string;
    academicNumber: string;
    clinicId?: string;
  } | null>(null);
  const [reasonList, setReasonList] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");
  const [triageLevel, setTriageLevel] = useState("LOW");
  const [triageReason, setTriageReason] = useState("");
  const [vitals, setVitals] = useState<VitalFields>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sid = search.get("studentId");
    if (sid) {
      fetch(`/api/v1/students/${sid}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.data) setStudent(j.data);
          else toast.error(j.error?.message ?? "تعذّر تحميل الطالب");
        })
        .catch(() => toast.error("تعذّر تحميل الطالب"));
    }
  }, [search]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!student) {
      toast.error("اختر الطالب أولاً");
      return;
    }
    const clinicId = student.clinicId ?? defaultClinicId;
    if (!clinicId) {
      toast.error("لا توجد عيادة مرتبطة بالطالب أو بالمستخدم");
      return;
    }
    if (reasonList.length === 0 && !otherReason.trim()) {
      toast.error("حدّد سبباً واحداً على الأقل");
      return;
    }

    setLoading(true);
    const payload: Record<string, unknown> = {
      clinicId,
      visitorType: "STUDENT",
      visitorId: student.id,
      reasonList,
      otherReason,
      triageLevel,
      triageReason: triageReason || undefined,
    };
    const vitalsPayload = cleanVitalsPayload(vitals);
    if (vitalsPayload) payload.vitals = vitalsPayload;

    const res = await fetch("/api/v1/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error?.message ?? "فشل الحفظ");
      return;
    }
    toast.success("تم فتح الزيارة");
    router.push(`/visits/${j.data.id}`);
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-5 overflow-visible pb-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#0e2350] via-[#16357a] to-[#2563eb] px-4 py-5 text-white shadow-lg sm:px-6 sm:py-6">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/70">زيارة عيادة</p>
            <h2 className="mt-1 text-xl font-black sm:text-2xl">تسجيل زيارة جديدة</h2>
            <p className="mt-2 max-w-xl text-xs font-semibold leading-relaxed text-white/85 sm:text-sm">
              اختر الطالب، حدّد سبب الزيارة والفرز، ثم احفظ لفتح السجل في الزيارات والملف الطبي.
            </p>
          </div>
          <Link href="/visits" className="shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              رجوع للسجل
            </Button>
          </Link>
        </div>
        <Stethoscope
          className="pointer-events-none absolute -bottom-4 -start-4 h-28 w-28 text-white/[0.07] sm:h-32 sm:w-32"
          aria-hidden
        />
      </div>

      <FormSection step={1} title="اختيار الطالب" icon={UserRound} className="z-20">
        <StudentPicker value={student} onSelect={setStudent} />
      </FormSection>

      <FormSection step={2} title="سبب الزيارة" icon={ClipboardList}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {REASONS.map((r) => {
            const checked = reasonList.includes(r);
            return (
              <label
                key={r}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition",
                  checked
                    ? "border-accent bg-accent/10 text-primary shadow-sm"
                    : "border-border bg-slate-50/80 text-foreground hover:border-accent/40 hover:bg-white",
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-accent accent-teal-600"
                  checked={checked}
                  onChange={(e) =>
                    setReasonList((prev) => (e.target.checked ? [...prev, r] : prev.filter((x) => x !== r)))
                  }
                />
                <span className="leading-snug">{VISIT_REASON_LABELS[r]}</span>
              </label>
            );
          })}
        </div>
        <textarea
          className="mt-3 min-h-[88px] w-full resize-y rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-semibold outline-none ring-accent/30 focus:ring-2"
          placeholder="تفاصيل إضافية عن الشكوى..."
          value={otherReason}
          onChange={(e) => setOtherReason(e.target.value)}
        />
      </FormSection>

      <FormSection step={3} title="فرز الحالة" icon={HeartPulse}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">مستوى الأولوية</label>
            <select
              className={cn(
                "w-full rounded-xl border px-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-accent/30",
                TRIAGE_STYLES[triageLevel] ?? "border-border bg-white",
              )}
              value={triageLevel}
              onChange={(e) => setTriageLevel(e.target.value)}
            >
              <option value="LOW">منخفض</option>
              <option value="MEDIUM">متوسط</option>
              <option value="HIGH">عالي</option>
              <option value="EMERGENCY">طارئ</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">سبب التصنيف (اختياري)</label>
            <input
              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="مثال: حرارة مرتفعة..."
              value={triageReason}
              onChange={(e) => setTriageReason(e.target.value)}
            />
          </div>
        </div>
      </FormSection>

      <FormSection step={4} title="العلامات الحيوية (اختياري)" icon={HeartPulse}>
        <VitalSignsForm values={vitals} onChange={setVitals} />
      </FormSection>

      <Button type="submit" disabled={loading || !student} size="lg" className="w-full sm:text-base">
        {loading ? "جاري فتح الزيارة..." : "فتح الزيارة وتسجيلها"}
      </Button>
    </form>
  );
}
