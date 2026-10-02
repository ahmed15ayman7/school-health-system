"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="الإشعارات"
      apiPath="/api/v1/notifications"
      resourceKey="notifications"
      
    />
  );
}
