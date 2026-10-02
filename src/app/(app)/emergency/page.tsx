"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="الحالات الطارئة"
      apiPath="/api/v1/emergency"
      resourceKey="emergency"
      
    />
  );
}
