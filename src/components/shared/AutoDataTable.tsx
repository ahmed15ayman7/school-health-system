"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  fieldLabel,
  formatCellValue,
  isHiddenField,
  LIST_COLUMNS,
} from "@/lib/field-labels";
import { resourceShowsAvatar } from "@/lib/avatar";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { DataGridCard } from "@/components/shared/DataGridCard";
import type { ApiMeta } from "@/lib/api";
import {
  loadViewMode,
  ViewModeToggle,
  type ViewMode,
} from "@/components/shared/ViewModeToggle";

type Row = Record<string, unknown>;

type Props = {
  title: string;
  apiPath: string;
  resourceKey?: string;
  detailHref?: (row: Row) => string;
  headerActions?: ReactNode;
  emptyMessage?: string;
  /** افتراضي list — يُحفظ في localStorage لكل resource */
  defaultView?: ViewMode;
};

function normalizeRows(data: unknown): Row[] {
  if (Array.isArray(data)) return data as Row[];
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.students) || Array.isArray(o.employees)) {
      const students = (o.students as Row[] | undefined)?.map((r) => ({
        ...r,
        recordType: "طالب",
      })) ?? [];
      const employees = (o.employees as Row[] | undefined)?.map((r) => ({
        ...r,
        recordType: "موظف",
      })) ?? [];
      return [...students, ...employees];
    }
    for (const key of ["items", "rows", "results"]) {
      if (Array.isArray(o[key])) return o[key] as Row[];
    }
    return [o as Row];
  }
  return [];
}

function pickColumns(rows: Row[], resourceKey?: string): string[] {
  const preset = resourceKey ? LIST_COLUMNS[resourceKey] : undefined;
  if (preset?.length) return preset;
  if (!rows.length) return ["name", "status"];
  return Object.keys(rows[0]).filter((k) => !isHiddenField(k) && k !== "id").slice(0, 8);
}

export function AutoDataTable({
  title,
  apiPath,
  resourceKey,
  detailHref,
  headerActions,
  emptyMessage = "لا توجد سجلات.",
  defaultView = "list",
}: Props) {
  const storageKey = `view-mode:${resourceKey ?? title}`;
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  useEffect(() => {
    setViewMode(loadViewMode(storageKey, defaultView));
  }, [storageKey, defaultView]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sep = apiPath.includes("?") ? "&" : "?";
      const url = `${apiPath}${sep}page=${page}&pageSize=20`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message ?? "تعذّر تحميل البيانات");
        setRows([]);
        return;
      }
      setRows(normalizeRows(json.data));
      setMeta(json.meta ?? null);
    } catch {
      setError("تعذّر الاتصال بالخادم");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [apiPath, page]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo(() => pickColumns(rows, resourceKey), [rows, resourceKey]);
  const totalPages = meta?.totalPages ?? 1;
  const showAvatar = resourceShowsAvatar(resourceKey);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-primary">{title}</h2>
          {meta?.total != null && (
            <p className="text-sm font-bold text-muted">{meta.total} سجل</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
            storageKey={storageKey}
          />
          {headerActions}
          <Button size="sm" variant="outline" type="button" onClick={() => load()}>
            تحديث
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm font-bold text-muted">جاري التحميل...</div>
        ) : error ? (
          <div className="p-8 text-center text-sm font-bold text-danger">{error}</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm font-bold text-muted">{emptyMessage}</div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((row, i) => (
              <DataGridCard
                key={String(row.id ?? i)}
                row={row}
                resourceKey={resourceKey}
                href={detailHref?.(row)}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-primary/[0.06]">
                  {showAvatar && (
                    <th className="w-14 px-3 py-3 text-right text-xs font-extrabold text-primary">
                      صورة
                    </th>
                  )}
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-right text-xs font-extrabold text-primary"
                    >
                      {fieldLabel(col)}
                    </th>
                  ))}
                  {detailHref && (
                    <th className="px-4 py-3 text-right text-xs font-extrabold text-primary">
                      إجراء
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={String(row.id ?? i)}
                    className="border-b border-border/80 transition-colors hover:bg-accent/[0.06]"
                  >
                    {showAvatar && (
                      <td className="px-3 py-2">
                        <PersonAvatar row={row} resourceKey={resourceKey} size="sm" />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col} className="px-4 py-3 font-semibold text-foreground">
                        {formatCellValue(col, row[col])}
                      </td>
                    ))}
                    {detailHref && (
                      <td className="px-4 py-3">
                        <Link
                          href={detailHref(row)}
                          className="text-xs font-extrabold text-accent hover:underline"
                        >
                          عرض
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <Button
              size="sm"
              variant="outline"
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </Button>
            <span className="text-xs font-bold text-muted">
              صفحة {page} من {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              التالي
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
