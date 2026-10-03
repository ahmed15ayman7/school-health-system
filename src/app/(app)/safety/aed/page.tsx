"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";

export default function Page() {
  return (
    <AutoDataTable title="أجهزة AED" apiPath="/api/v1/safety/aed" resourceKey="safety/aed" />
  );
}
