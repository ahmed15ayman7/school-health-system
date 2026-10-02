"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="حقائب الإسعاف"
      apiPath="/api/v1/health"
      resourceKey="safety/first-aid"
      
    />
  );
}
