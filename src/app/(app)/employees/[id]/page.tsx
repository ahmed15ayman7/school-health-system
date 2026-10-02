"use client";

import { RecordDetailPanel } from "@/components/shared/RecordDetailPanel";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const id = params?.id as string | undefined;
  return (
    <RecordDetailPanel
      title="ملف الموظف"
      apiPath="/api/v1/employees"
      recordId={id}
      backHref="/employees"
    />
  );
}
