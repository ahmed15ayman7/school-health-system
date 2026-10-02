"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="التقارير"
      apiPath="/api/v1/health"
      resourceKey="reports"
      
    />
  );
}
