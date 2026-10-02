"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";

export default function SettingsUsersPage() {
  return (
    <AutoDataTable
      title="المستخدمون"
      apiPath="/api/v1/settings/users"
      resourceKey="settings"
    />
  );
}
