"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";

export default function Page() {
  return (
    <AutoDataTable
      title="شهادات صحة العاملين"
      apiPath="/api/v1/canteen/staff-certificates"
      resourceKey="canteen/staff-certs"
      emptyMessage="لا توجد شهادات — أضف من API أو seed."
    />
  );
}
