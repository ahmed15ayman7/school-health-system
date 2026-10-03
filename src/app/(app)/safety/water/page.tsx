"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";

export default function Page() {
  return (
    <AutoDataTable title="فحص المياه (6 أشهر)" apiPath="/api/v1/safety/water-tests" resourceKey="safety/water" />
  );
}
