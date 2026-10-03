"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Search, UserRound, X } from "lucide-react";

export type StudentPick = {
  id: string;
  name: string;
  academicNumber: string;
  grade?: string;
  class?: string;
  clinicId?: string;
};

function minQueryLen(term: string) {
  return /^\d/.test(term) ? 1 : 2;
}

function normalizeStudentList(data: unknown): StudentPick[] {
  if (Array.isArray(data)) return data as StudentPick[];
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.students)) return o.students as StudentPick[];
  }
  return [];
}

export function StudentPicker({
  value,
  onSelect,
}: {
  value?: StudentPick | null;
  onSelect: (s: StudentPick | null) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<StudentPick[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const trimmedQ = q.trim();
  const minLen = minQueryLen(trimmedQ);

  const search = useCallback(async (query: string) => {
    const term = query.trim();
    if (term.length < minQueryLen(term)) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/students/search?q=${encodeURIComponent(term)}`, {
        credentials: "same-origin",
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: unknown;
        error?: { message?: string };
      };
      if (!res.ok || json.success === false) {
        setResults([]);
        setError(json.error?.message ?? "تعذّر البحث");
        return;
      }
      setResults(normalizeStudentList(json.data));
    } catch {
      setResults([]);
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || value) return;
    const t = setTimeout(() => search(q), 280);
    return () => clearTimeout(t);
  }, [q, open, value, search]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-gradient-to-l from-accent/[0.08] to-transparent p-4 shadow-sm">
        <PersonAvatar row={value as Record<string, unknown>} resourceKey="students" size="md" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-black text-primary">{value.name}</div>
          <div className="mt-0.5 flex flex-wrap gap-2 text-xs font-bold text-muted">
            <span>{value.academicNumber}</span>
            {value.grade && <span>{value.grade}</span>}
            {value.class && <span>{value.class}</span>}
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-bold text-primary hover:bg-slate-50"
          onClick={() => {
            onSelect(null);
            setQ("");
            setResults([]);
            setOpen(true);
          }}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          تغيير
        </button>
      </div>
    );
  }

  const showDropdown = open && q.trim().length >= minLen;
  const showHint = open && q.trim().length > 0 && q.trim().length < minLen;

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={listId} className="mb-2 flex items-center gap-2 text-xs font-bold text-muted">
        <UserRound className="h-4 w-4 text-accent" aria-hidden />
        ابحث بالاسم أو الرقم الأكاديمي أو QR
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <Input
          id={listId}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={`${listId}-listbox`}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="مثال: أحمد أو 2026001..."
          className="h-12 ps-10 text-base shadow-sm"
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
        />
        {loading && (
          <Loader2
            className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-accent"
            aria-hidden
          />
        )}
      </div>

      {showHint && (
        <p className="mt-2 text-xs font-bold text-muted">اكتب حرفين على الأقل (أو رقم واحد للبحث بالرقم الأكاديمي)</p>
      )}

      {error && (
        <p className="mt-2 rounded-lg border border-danger/30 bg-red-50 px-3 py-2 text-xs font-bold text-danger">
          {error}
        </p>
      )}

      {showDropdown && (
        <div
          id={`${listId}-listbox`}
          role="listbox"
          className={cn(
            "absolute z-[100] mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl ring-1 ring-black/5",
            "max-h-[min(18rem,50vh)] overflow-y-auto",
          )}
        >
          {loading && results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm font-bold text-muted">جاري البحث...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm font-bold text-muted">
              لا توجد نتائج. جرّب اسماً أو رقماً مختلفاً، أو تأكد أن الطالب مسجّل في عيادتك.
            </p>
          ) : (
            <ul className="divide-y divide-border/80">
              {results.map((s) => (
                <li key={s.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    className="flex w-full items-center gap-3 px-3 py-3 text-right transition hover:bg-accent/[0.08] active:bg-accent/10"
                    onClick={() => {
                      onSelect(s);
                      setQ("");
                      setResults([]);
                      setOpen(false);
                    }}
                  >
                    <PersonAvatar row={s as Record<string, unknown>} resourceKey="students" size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black text-primary">{s.name}</div>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] font-bold text-muted">
                        <span>{s.academicNumber}</span>
                        {s.grade && <span>{s.grade}</span>}
                        {s.class && <span>فصل {s.class}</span>}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
