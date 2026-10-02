"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="حالات اجتماعية"
      apiPath="/api/v1/social/cases"
      resourceKey="social/cases"
      
    />
  );
}
