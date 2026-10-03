"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { AutoDataTable } from "@/components/shared/AutoDataTable";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";

export default function InventoryPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;
  const canReceive = role ? can(role, "inventory", "create") : false;
  const canDefineMed = role ? can(role, "medications", "create") : false;

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-border bg-card px-4 py-3 text-xs font-bold leading-relaxed text-muted">
        عرض دفعات المخزون حسب العيادة (الكمية وتاريخ الصلاحية). التنبيهات من «تنبيهات المخزون».
      </p>
      <AutoDataTable
        title="مخزون العيادة (دفعات)"
        apiPath="/api/v1/inventory"
        resourceKey="inventory"
        headerActions={
          <>
            {canReceive && (
              <Link href="/inventory/receive">
                <Button size="sm" type="button">
                  + استلام دفعة
                </Button>
              </Link>
            )}
            {canDefineMed && (
              <Link href="/medications/new">
                <Button size="sm" variant="outline" type="button">
                  + تعريف دواء
                </Button>
              </Link>
            )}
            <Link href="/inventory/alerts">
              <Button size="sm" variant="outline" type="button">
                تنبيهات
              </Button>
            </Link>
          </>
        }
      />
    </div>
  );
}
