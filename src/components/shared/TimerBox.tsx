"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function TimerBox({
  since,
  label,
  warnAfterMinutes = 15,
}: {
  since: string | Date;
  label?: string;
  warnAfterMinutes?: number;
}) {
  const start = typeof since === "string" ? new Date(since).getTime() : since.getTime();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [start]);

  const mm = Math.floor(elapsed / 60);
  const ss = elapsed % 60;
  const late = mm >= warnAfterMinutes;

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 text-center font-mono text-sm font-bold",
        late ? "border-red-300 bg-red-50 text-red-700" : "border-border bg-slate-50 text-primary",
      )}
    >
      {label && <div className="mb-1 text-[10px] font-extrabold text-muted">{label}</div>}
      {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
    </div>
  );
}
