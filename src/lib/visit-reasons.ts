export const VISIT_REASON_LABELS: Record<string, string> = {
  PAIN: "ألم",
  INJURY: "إصابة",
  FEVER: "حمى",
  HEADACHE: "صداع",
  ABDOMINAL_PAIN: "ألم بطن",
  VOMITING: "قيء",
  DIARRHEA: "إسهال",
  ALLERGY: "حساسية",
  DIZZINESS: "دوخة",
  DYSPNEA: "ضيق تنفس",
  RESPIRATORY: "تنفسي",
  PSYCHOLOGICAL: "نفسي",
  CHRONIC_FOLLOWUP: "متابعة مزمن",
  MEDICATION_ADMIN: "إعطاء دواء",
  ROUTINE_CHECK: "فحص روتيني",
  OTHER: "أخرى",
};

export function formatVisitReasons(reasonsJson: unknown): string {
  if (!reasonsJson || typeof reasonsJson !== "object") return "—";
  const o = reasonsJson as { selected?: string[]; other?: string | null };
  const parts = (o.selected ?? []).map((k) => VISIT_REASON_LABELS[k] ?? k);
  if (o.other?.trim()) parts.push(o.other.trim());
  return parts.length ? parts.join("، ") : "—";
}
