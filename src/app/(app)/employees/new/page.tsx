"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/employees")
      .then((r) => r.json())
      .then((j) => setData(j.data ?? j))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-primary">إضافة موظف</h2>
        <Button size="sm" onClick={() => location.reload()}>تحديث</Button>
      </div>
      {loading ? (
        <p className="text-sm font-bold text-muted">جاري التحميل...</p>
      ) : (
        <pre className="overflow-auto rounded-2xl border border-border bg-card p-4 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
