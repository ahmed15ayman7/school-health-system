"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { AutoDataTable } from "@/components/shared/AutoDataTable";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";

export default function MedicationsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;
  const canCreateMed = role ? can(role, "medications", "create") : false;
  const canReceive = role ? can(role, "inventory", "create") : false;

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-accent/20 bg-accent/[0.06] px-4 py-3 text-xs font-bold leading-relaxed text-primary">
        كل عيادة لها قائمة أدوية ومخزون مستقل. من هنا تعرّف الأدوية، ثم من «استلام مخزون» تضيف الكميات
        (دفعات) — الصرف من العيادة يخصم من رصيدها فقط.
      </p>
      <AutoDataTable
        title="أدوية العيادة"
        apiPath="/api/v1/medications"
        resourceKey="medications"
        headerActions={
          <>
            {canCreateMed && (
              <Link href="/medications/new">
                <Button size="sm" type="button">
                  + تعريف دواء
                </Button>
              </Link>
            )}
            {canReceive && (
              <Link href="/inventory/receive">
                <Button size="sm" variant="outline" type="button">
                  + استلام مخزون
                </Button>
              </Link>
            )}
          </>
        }
      />
    </div>
  );
}
