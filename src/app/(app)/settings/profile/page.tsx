"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="الملف الشخصي"
      apiPath="/api/v1/health"
      resourceKey="settings"
      
    />
  );
}
