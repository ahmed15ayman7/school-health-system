"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="طلاب مترددون"
      apiPath="/api/v1/alerts/frequent"
      resourceKey="alerts/frequent"
      
    />
  );
}
