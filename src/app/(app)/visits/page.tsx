import Link from "next/link";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { AutoDataTable } from "@/components/shared/AutoDataTable";
import { Button } from "@/components/ui/button";

export default async function VisitsPage() {
  const session = await auth();
  const canCreate = session?.user.role ? can(session.user.role, "visits", "create") : false;

  return (
    <AutoDataTable
      title="سجل الزيارات"
      apiPath="/api/v1/visits"
      resourceKey="visits"
      defaultView="list"
      detailHref={(row) => `/visits/${String(row.id)}`}
      headerActions={
        canCreate ? (
          <Link href="/visits/new">
            <Button size="sm" type="button">
              + تسجيل زيارة
            </Button>
          </Link>
        ) : undefined
      }
    />
  );
}
