"use client";

import { useState } from "react";
import { AutoDataTable } from "@/components/shared/AutoDataTable";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          setActiveQuery(query.trim());
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالاسم (طلاب أو موظفين)..."
          className="min-w-[240px] flex-1 rounded-xl border border-border px-3 py-2 text-sm font-semibold"
        />
        <Button type="submit">بحث</Button>
      </form>
      {activeQuery ? (
        <AutoDataTable
          title="نتائج البحث"
          apiPath={`/api/v1/search?q=${encodeURIComponent(activeQuery)}`}
          resourceKey="search"
          emptyMessage="لا توجد نتائج مطابقة."
        />
      ) : (
        <p className="text-sm font-bold text-muted">اكتب اسمًا ثم اضغط بحث.</p>
      )}
    </div>
  );
}
