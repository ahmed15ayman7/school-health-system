"use client";

import { Input } from "@/components/ui/input";

export type VitalFields = {
  temperature?: string;
  bloodPressureSystolic?: string;
  bloodPressureDiastolic?: string;
  pulse?: string;
  respirationRate?: string;
  spo2?: string;
  bloodSugar?: string;
  weight?: string;
  height?: string;
};

export function VitalSignsForm({
  values,
  onChange,
}: {
  values: VitalFields;
  onChange: (v: VitalFields) => void;
}) {
  const set = (key: keyof VitalFields, val: string) => onChange({ ...values, [key]: val });

  const fields: { key: keyof VitalFields; label: string; placeholder: string }[] = [
    { key: "temperature", label: "الحرارة °C", placeholder: "36.5" },
    { key: "bloodPressureSystolic", label: "ضغط انقباضي", placeholder: "120" },
    { key: "bloodPressureDiastolic", label: "ضغط انبساطي", placeholder: "80" },
    { key: "pulse", label: "النبض", placeholder: "72" },
    { key: "respirationRate", label: "التنفس", placeholder: "16" },
    { key: "spo2", label: "SpO2 %", placeholder: "98" },
    { key: "bloodSugar", label: "السكر mg/dL", placeholder: "90" },
    { key: "weight", label: "الوزن kg", placeholder: "45" },
    { key: "height", label: "الطول cm", placeholder: "150" },
  ];

  const w = parseFloat(values.weight ?? "");
  const h = parseFloat(values.height ?? "");
  const bmi = w > 0 && h > 0 ? (w / (h / 100) ** 2).toFixed(1) : "—";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map((f) => (
        <label key={f.key} className="block text-xs font-extrabold text-primary">
          {f.label}
          <Input
            type="number"
            step="any"
            className="mt-1"
            placeholder={f.placeholder}
            value={values[f.key] ?? ""}
            onChange={(e) => set(f.key, e.target.value)}
          />
        </label>
      ))}
      <div className="flex items-end">
        <div className="rounded-xl border border-border bg-slate-50 px-3 py-2 text-sm font-bold">
          BMI: {bmi}
        </div>
      </div>
    </div>
  );
}

export function parseVitals(values: VitalFields) {
  const num = (s?: string) => (s && s !== "" ? Number(s) : undefined);
  return {
    temperature: num(values.temperature),
    bloodPressureSystolic: num(values.bloodPressureSystolic),
    bloodPressureDiastolic: num(values.bloodPressureDiastolic),
    pulse: num(values.pulse),
    respirationRate: num(values.respirationRate),
    spo2: num(values.spo2),
    bloodSugar: num(values.bloodSugar),
    weight: num(values.weight),
    height: num(values.height),
  };
}
