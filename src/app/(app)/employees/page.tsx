"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <AutoDataTable
      title="الموظفون"
      apiPath="/api/v1/employees"
      resourceKey="employees"
      detailHref={(row) => `/employees/${String(row.id)}`}
    />
  );
}
