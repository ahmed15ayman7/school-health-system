"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="الأدوية"
      apiPath="/api/v1/medications"
      resourceKey="medications"
      
    />
  );
}
