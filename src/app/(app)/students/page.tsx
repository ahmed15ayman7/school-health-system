"use client";

import Link from "next/link";
import { AutoDataTable } from "@/components/shared/AutoDataTable";
import { Button } from "@/components/ui/button";

export default function StudentsPage() {
  return (
    <AutoDataTable
      title="الطلاب"
      apiPath="/api/v1/students"
      resourceKey="students"
      defaultView="grid"
      detailHref={(row) => `/students/${String(row.id)}`}
      headerActions={
        <>
          <Link href="/students/import">
            <Button size="sm" variant="outline" type="button">
              استيراد Excel
            </Button>
          </Link>
          <Link href="/students/new">
            <Button size="sm" type="button">
              + طالب جديد
            </Button>
          </Link>
        </>
      }
    />
  );
}
