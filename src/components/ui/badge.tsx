import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  yellow: "bg-amber-100 text-amber-800 border-amber-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  green: "bg-emerald-100 text-emerald-800 border-emerald-200",
  teal: "bg-teal-100 text-teal-800 border-teal-200",
  red: "bg-red-100 text-red-800 border-red-200",
  gray: "bg-slate-100 text-slate-700 border-slate-200",
};

export function Badge({
  tone = "gray",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold",
        tones[tone] ?? tones.gray,
        className,
      )}
      {...props}
    />
  );
}
