"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="تنبيهات المخزون"
      apiPath="/api/v1/inventory"
      resourceKey="inventory"
      
    />
  );
}
