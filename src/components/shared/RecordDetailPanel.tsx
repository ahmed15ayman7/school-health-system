"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fieldLabel, formatCellValue, isHiddenField } from "@/lib/field-labels";

type Props = {
  title: string;
  apiPath: string;
  recordId?: string;
  backHref?: string;
};

function asRecord(data: unknown, recordId?: string): Record<string, unknown> | null {
  if (Array.isArray(data)) {
    if (!recordId) return (data[0] as Record<string, unknown>) ?? null;
    return (
      (data as Record<string, unknown>[]).find((r) => String(r.id) === recordId) ?? null
    );
  }
  if (data && typeof data === "object") return data as Record<string, unknown>;
  return null;
}

export function RecordDetailPanel({ title, apiPath, recordId, backHref }: Props) {
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const directUrl =
        recordId && !apiPath.includes("[id]")
          ? `${apiPath.replace(/\/$/, "")}/${recordId}`
          : apiPath;
      let res = await fetch(directUrl);
      let json = await res.json();

      if ((!res.ok || json.success === false) && recordId) {
        res = await fetch(apiPath);
        json = await res.json();
      }

      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "تعذّر تحميل السجل");
        setRecord(null);
        return;
      }
      setRecord(asRecord(json.data, recordId));
    } catch {
      setError("تعذّر الاتصال بالخادم");
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [apiPath, recordId]);

  useEffect(() => {
    load();
  }, [load]);

  const entries = useMemo(() => {
    if (!record) return [];
    return Object.entries(record).filter(([k]) => !isHiddenField(k));
  }, [record]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-primary">{title}</h2>
        <div className="flex gap-2">
          {backHref && (
            <Link href={backHref}>
              <Button size="sm" variant="outline" type="button">
                رجوع
              </Button>
            </Link>
          )}
          <Button size="sm" variant="outline" type="button" onClick={() => load()}>
            تحديث
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        {loading ? (
          <p className="text-sm font-bold text-muted">جاري التحميل...</p>
        ) : error ? (
          <p className="text-sm font-bold text-danger">{error}</p>
        ) : !record ? (
          <p className="text-sm font-bold text-muted">السجل غير موجود.</p>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            {entries.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-border/80 bg-background/50 px-4 py-3">
                <dt className="text-xs font-extrabold text-muted">{fieldLabel(key)}</dt>
                <dd className="mt-1 text-sm font-bold text-foreground">{formatCellValue(key, value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
