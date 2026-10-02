"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="بلاغات التسمم"
      apiPath="/api/v1/canteen/incidents"
      resourceKey="canteen/incidents"
      
    />
  );
}
