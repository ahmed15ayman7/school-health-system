"use client";

import * as XLSX from "xlsx";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function StudentImportPage() {
  const [report, setReport] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);

  async function onFile(file: File) {
    setLoading(true);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]!];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    const res = await fetch("/api/v1/students/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const json = await res.json();
    setReport(json.data ?? json);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-primary">استيراد الطلاب (Excel/CSV)</h2>
      <p className="text-sm font-bold text-muted">الحد: 50MB، 50,000 صف — مع معاينة وتقرير (جديد/محدّث/مرفوض)</p>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        className="block w-full rounded-xl border border-border bg-card p-3 text-sm"
      />
      {loading && <p className="text-sm font-bold">جاري المعالجة...</p>}
      {report && (
        <pre className="overflow-auto rounded-2xl border border-border bg-card p-4 text-xs">{JSON.stringify(report, null, 2)}</pre>
      )}
      <Button variant="outline" onClick={() => window.open("/templates/students-template.csv", "_blank")}>
        تنزيل قالب CSV
      </Button>
    </div>
  );
}
