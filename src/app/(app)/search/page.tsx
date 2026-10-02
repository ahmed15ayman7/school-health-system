"use client";

import { useState } from "react";
import { AutoDataTable } from "@/components/shared/AutoDataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [grade, setGrade] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const apiPath = activeQuery
    ? `/api/v1/search?q=${encodeURIComponent(activeQuery)}&type=${type}&grade=${encodeURIComponent(grade)}`
    : "";

  return (
    <div className="space-y-4">
      <form
        className="grid gap-2 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          setActiveQuery(query.trim());
        }}
      >
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="اسم / رقم / QR" />
        <select
          className="rounded-xl border border-border px-3 py-2 text-sm font-bold"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">الكل</option>
          <option value="student">طلاب</option>
          <option value="employee">موظفون</option>
        </select>
        <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="الصف (اختياري)" />
        <Button type="submit">بحث FR-120</Button>
      </form>
      {apiPath ? (
        <AutoDataTable title="نتائج البحث" apiPath={apiPath} resourceKey="search" emptyMessage="لا توجد نتائج." />
      ) : (
        <p className="text-sm font-bold text-muted">حدّد معايير البحث.</p>
      )}
    </div>
  );
}
