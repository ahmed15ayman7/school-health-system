"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="التعاميم"
      apiPath="/api/v1/circulars"
      resourceKey="circulars"
      
    />
  );
}
