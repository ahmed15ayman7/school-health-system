"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="فحوص المقصف"
      apiPath="/api/v1/canteen/inspections"
      resourceKey="canteen/inspections"
      
    />
  );
}
