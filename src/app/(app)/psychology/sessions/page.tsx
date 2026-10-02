"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="جلسات نفسية"
      apiPath="/api/v1/psychology/sessions"
      resourceKey="psychology/sessions"
      
    />
  );
}
