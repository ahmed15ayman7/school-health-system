"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="تقارير موظفين"
      apiPath="/api/v1/health"
      resourceKey="reports"
      
    />
  );
}
