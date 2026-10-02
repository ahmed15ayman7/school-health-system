"use client";

import { useEffect, useState } from "react";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { Input } from "@/components/ui/input";

type Student = {
  id: string;
  name: string;
  academicNumber: string;
  grade?: string;
  class?: string;
  clinicId?: string;
};

export function StudentPicker({
  value,
  onSelect,
}: {
  value?: Student | null;
  onSelect: (s: Student | null) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Student[]>([]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/v1/students/search?q=${encodeURIComponent(q.trim())}`)
        .then((r) => r.json())
        .then((j) => setResults(j.data ?? []))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <PersonAvatar row={value as Record<string, unknown>} resourceKey="students" size="sm" />
          <div className="flex-1">
            <div className="font-black text-primary">{value.name}</div>
            <div className="text-xs font-bold text-muted">{value.academicNumber}</div>
          </div>
          <button type="button" className="text-xs font-bold text-accent" onClick={() => onSelect(null)}>
            تغيير
          </button>
        </div>
      ) : (
        <>
          <Input placeholder="ابحث بالاسم أو الرقم أو QR..." value={q} onChange={(e) => setQ(e.target.value)} />
          <ul className="max-h-48 overflow-y-auto rounded-xl border border-border bg-white">
            {results.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-right hover:bg-accent/5"
                  onClick={() => {
                    onSelect(s);
                    setQ("");
                    setResults([]);
                  }}
                >
                  <PersonAvatar row={s as Record<string, unknown>} resourceKey="students" size="sm" />
                  <span className="text-sm font-bold">{s.name}</span>
                  <span className="text-xs text-muted">{s.academicNumber}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
