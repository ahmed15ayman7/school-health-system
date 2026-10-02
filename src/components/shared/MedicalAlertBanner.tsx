import { cn } from "@/lib/utils";

export type MedicalAlert = {
  type: "allergy" | "chronic" | "medication" | "warning";
  severity?: "MILD" | "MODERATE" | "SEVERE";
  label: string;
};

const styles: Record<MedicalAlert["type"], string> = {
  allergy: "border-red-300 bg-red-50 text-red-800",
  chronic: "border-amber-300 bg-amber-50 text-amber-900",
  medication: "border-blue-300 bg-blue-50 text-blue-900",
  warning: "border-orange-300 bg-orange-50 text-orange-900",
};

export function MedicalAlertBanner({ alerts }: { alerts: MedicalAlert[] }) {
  if (!alerts.length) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={i} className={cn("rounded-xl border-2 px-4 py-3 text-sm font-bold", styles[a.type])}>
          {a.label}
          {a.severity === "SEVERE" && " — خطورة شديدة"}
        </div>
      ))}
    </div>
  );
}
