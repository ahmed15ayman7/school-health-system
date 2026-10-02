"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <AutoDataTable
      title="العيادات"
      apiPath="/api/v1/settings/clinics"
      resourceKey="clinics"
      detailHref={(row) => `/clinics/${String(row.id)}`}
    />
  );
}
