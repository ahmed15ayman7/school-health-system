"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";

export default function Page() {
  return (
    <AutoDataTable title="التراخيص والشهادات" apiPath="/api/v1/safety/licenses" resourceKey="safety/licenses" />
  );
}
