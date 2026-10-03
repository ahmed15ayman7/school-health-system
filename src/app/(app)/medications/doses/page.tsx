"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-2">
        <h2 className="text-xl font-black text-primary">جرعات اليوم</h2>
        <Link href="/medications">
          <Button size="sm" variant="outline">
            الأدوية
          </Button>
        </Link>
      </div>
      <AutoDataTable title="الجدول العلاجي" apiPath="/api/v1/medications/doses/today" resourceKey="medications" />
    </div>
  );
}
