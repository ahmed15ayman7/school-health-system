"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="طباعة بطاقات"
      apiPath="/api/v1/health"
      resourceKey="qr-print"
      
    />
  );
}
