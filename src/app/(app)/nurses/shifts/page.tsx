"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="المناوبات"
      apiPath="/api/v1/health"
      resourceKey="nurses/shifts"
      
    />
  );
}
