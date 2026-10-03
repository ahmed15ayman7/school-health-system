"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AutoDataTable } from "@/components/shared/AutoDataTable";

export default function Page() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <a href="/api/v1/reports/export/medical">
          <Button size="sm" type="button">
            Excel طبي
          </Button>
        </a>
        <a href="/api/v1/reports/export/safety">
          <Button size="sm" variant="outline" type="button">
            Excel سلامة
          </Button>
        </a>
        <Link href="/reports/medical">
          <Button size="sm" variant="outline" type="button">
            تقرير طبي
          </Button>
        </Link>
      </div>
      <AutoDataTable title="ملخص التقارير" apiPath="/api/v1/reports" resourceKey="reports" />
    </div>
  );
}
