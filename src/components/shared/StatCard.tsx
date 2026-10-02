"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

const accentMap = {
  blue: "after:bg-gradient-to-b after:from-blue-400 after:to-blue-600",
  red: "after:bg-gradient-to-b after:from-red-400 after:to-red-600",
  orange: "after:bg-gradient-to-b after:from-amber-400 after:to-amber-600",
  green: "after:bg-gradient-to-b after:from-emerald-400 after:to-emerald-600",
  teal: "after:bg-gradient-to-b after:from-teal-400 after:to-teal-600",
};

export function StatCard({
  label,
  value,
  icon,
  tone = "teal",
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  tone?: keyof typeof accentMap;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm",
        "after:absolute after:inset-y-0 after:start-0 after:w-1",
        accentMap[tone],
      )}
    >
      <div className="flex items-center gap-3">
        {icon && <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-lg">{icon}</div>}
        <div>
          <div className="text-2xl font-black text-primary">{value}</div>
          <div className="text-xs font-bold text-muted">{label}</div>
        </div>
      </div>
    </motion.div>
  );
}
