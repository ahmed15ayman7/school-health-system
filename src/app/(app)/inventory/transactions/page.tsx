"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="حركة المخزون"
      apiPath="/api/v1/inventory"
      resourceKey="inventory"
      
    />
  );
}
