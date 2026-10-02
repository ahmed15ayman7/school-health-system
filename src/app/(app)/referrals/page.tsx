"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <AutoDataTable
      title="تحويلات الطلاب"
      apiPath="/api/v1/referrals"
      resourceKey="referrals"
      detailHref={(row) => `/referrals/${String(row.id)}`}
    />
  );
}
