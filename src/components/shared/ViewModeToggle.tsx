"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "grid";

type Props = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  storageKey?: string;
};

export function loadViewMode(storageKey: string, fallback: ViewMode = "list"): ViewMode {
  if (typeof window === "undefined") return fallback;
  const v = localStorage.getItem(storageKey);
  return v === "grid" || v === "list" ? v : fallback;
}

export function saveViewMode(storageKey: string, mode: ViewMode) {
  try {
    localStorage.setItem(storageKey, mode);
  } catch {
    /* ignore */
  }
}

export function ViewModeToggle({ value, onChange, storageKey }: Props) {
  function set(mode: ViewMode) {
    onChange(mode);
    if (storageKey) saveViewMode(storageKey, mode);
  }

  return (
    <div
      className="inline-flex rounded-xl border border-border bg-background p-0.5"
      role="group"
      aria-label="طريقة العرض"
    >
      <button
        type="button"
        title="عرض قائمة"
        aria-pressed={value === "list"}
        onClick={() => set("list")}
        className={cn(
          "inline-flex h-8 w-9 items-center justify-center rounded-lg transition-colors",
          value === "list"
            ? "bg-primary text-white shadow-sm"
            : "text-muted hover:bg-card hover:text-primary",
        )}
      >
        <List className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        title="عرض شبكة"
        aria-pressed={value === "grid"}
        onClick={() => set("grid")}
        className={cn(
          "inline-flex h-8 w-9 items-center justify-center rounded-lg transition-colors",
          value === "grid"
            ? "bg-primary text-white shadow-sm"
            : "text-muted hover:bg-card hover:text-primary",
        )}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
