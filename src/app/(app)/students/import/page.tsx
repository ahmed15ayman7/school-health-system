"use client";

import * as XLSX from "xlsx";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ImportReport = {
  created?: number;
  updated?: number;
  rejected?: number;
  errors?: { row: number; reason: string }[];
};

export default function StudentImportPage() {
  const [report, setReport] = useState<ImportReport | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  async function onFile(file: File) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]!];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    setPreview(rows.slice(0, 5));
    setReport(null);
  }

  async function confirmImport() {
    if (!preview.length) return;
    setLoading(true);
    const res = await fetch("/api/v1/students/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: preview }),
    });
    const json = await res.json();
    setReport(json.data ?? json);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-primary">استيراد الطلاب (Excel/CSV)</h2>
      <p className="text-sm font-bold text-muted">معاينة ثم تأكيد — تقرير FR-132</p>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        className="block w-full rounded-xl border border-border bg-card p-3 text-sm"
      />
      {preview.length > 0 && (
        <Card>
          <CardContent className="space-y-2 pt-4">
            <p className="text-sm font-bold">معاينة ({preview.length} صفوف للعرض)</p>
            <pre className="max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 text-xs">
              {JSON.stringify(preview, null, 2)}
            </pre>
            <Button type="button" onClick={confirmImport} disabled={loading}>
              {loading ? "جاري الاستيراد..." : "تأكيد الاستيراد"}
            </Button>
          </CardContent>
        </Card>
      )}
      {report && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-4 text-center font-black text-emerald-700">
              جديد: {report.created ?? 0}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center font-black text-blue-700">
              محدّث: {report.updated ?? 0}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center font-black text-red-700">
              مرفوض: {report.rejected ?? 0}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
