"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { AutoDataTable } from "@/components/shared/AutoDataTable";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";

export default function MainInventoryPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;
  const canReceive = role ? can(role, "inventory", "create") : false;

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3 text-xs font-bold leading-relaxed text-primary">
        المخزن الرئيسي (مركزي): استلام المشتريات والدفعات هنا. العيادات لا تستلم مباشرة — تُرسل
        «طلباً داخلياً» لنقل الكمية إلى مخزونها الفرعي.
      </p>
      <AutoDataTable
        title="المخزن الرئيسي — دفعات"
        apiPath="/api/v1/inventory/main"
        resourceKey="inventory"
        headerActions={
          canReceive ? (
            <Link href="/inventory/receive">
              <Button size="sm" type="button">
                + استلام للمخزن الرئيسي
              </Button>
            </Link>
          ) : undefined
        }
      />
    </div>
  );
}
