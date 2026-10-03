"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";

export default function Page() {
  return (
    <AutoDataTable
      title="فحوص السلامة"
      apiPath="/api/v1/safety/inspections"
      resourceKey="safety/inspections"
    />
  );
}
