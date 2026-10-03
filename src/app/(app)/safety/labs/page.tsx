"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";

export default function Page() {
  return (
    <AutoDataTable title="مختبرات العلوم" apiPath="/api/v1/safety/labs" resourceKey="safety/labs" />
  );
}
