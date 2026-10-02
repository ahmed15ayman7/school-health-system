"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="تقارير طبية"
      apiPath="/api/v1/health"
      resourceKey="reports"
      
    />
  );
}
