"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <AutoDataTable
      title="سجل الزيارات"
      apiPath="/api/v1/visits"
      resourceKey="visits"
      detailHref={(row) => `/visits/${String(row.id)}`}
    />
  );
}
