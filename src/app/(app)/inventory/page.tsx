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
  const canStockIn = role ? can(role, "inventory", "create") : false;
  const canDefineMed = role ? can(role, "medications", "create") : false;

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-border bg-card px-4 py-3 text-xs font-bold leading-relaxed text-muted">
        مخزون فرعي للعيادة (بعد التحويل من الرئيسي). للرئيسي: «المخزن الرئيسي». لطلب كميات: «طلب
        من الرئيسي».
      </p>
      <AutoDataTable
        title="مخزون العيادة الفرعي"
        apiPath="/api/v1/inventory"
        resourceKey="inventory"
        headerActions={
          <>
            {canStockIn && (
              <Link href="/inventory/requests/new">
                <Button size="sm" type="button">
                  + طلب من الرئيسي
                </Button>
              </Link>
            )}
            <Link href="/inventory/requests">
              <Button size="sm" variant="outline" type="button">
                الطلبات
              </Button>
            </Link>
            <Link href="/inventory/main">
              <Button size="sm" variant="outline" type="button">
                المخزن الرئيسي
              </Button>
            </Link>
            {canStockIn && (
              <Link href="/inventory/receive">
                <Button size="sm" variant="outline" type="button">
                  استلام للرئيسي
                </Button>
              </Link>
            )}
            {canDefineMed && (
              <Link href="/medications/new">
                <Button size="sm" variant="outline" type="button">
                  تعريف دواء
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
