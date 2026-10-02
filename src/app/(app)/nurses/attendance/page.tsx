"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="حضور التمريض"
      apiPath="/api/v1/health"
      resourceKey="nurses/attendance"
      
    />
  );
}
