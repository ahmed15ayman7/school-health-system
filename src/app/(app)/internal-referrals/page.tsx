"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";


export default function Page() {
  return (
    <AutoDataTable
      title="تحويلات داخلية"
      apiPath="/api/v1/internal-referrals"
      resourceKey="internal-referrals"
      
    />
  );
}
