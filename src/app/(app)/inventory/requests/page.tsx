"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";
import { toast } from "sonner";
import { formatCellValue } from "@/lib/field-labels";

type RequestRow = {
  id: string;
  requestNumber: string;
  status: string;
  clinicName: string;
  requestedByName: string;
  createdAt: string;
  lines: { id: string; medicationName: string; quantityRequested: number; quantityApproved?: number | null }[];
};

const STATUS_AR: Record<string, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "موافق عليه",
  REJECTED: "مرفوض",
  FULFILLED: "تم التنفيذ",
  CANCELLED: "ملغى",
};

export default function StockRequestsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;
  const canCreate = role ? can(role, "inventory", "create") : false;
  const canApprove = role ? can(role, "inventory", "approve") : false;

  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/inventory/stock-requests");
      const j = await res.json();
      setRows(j.data ?? []);
    } catch {
      toast.error("تعذّر تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "approve" | "reject" | "fulfill") {
    const res = await fetch(`/api/v1/inventory/stock-requests/${id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: action === "approve" ? JSON.stringify({}) : JSON.stringify({}),
    });
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error?.message ?? "فشل الإجراء");
      return;
    }
    toast.success("تم تحديث الطلب");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-black text-primary">طلبات المخزون الداخلية</h2>
          <p className="text-xs font-bold text-muted">من مخزون العيادة → المخزن الرئيسي → تحويل للفرعي</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Link href="/inventory/requests/new">
              <Button size="sm" type="button">
                + طلب جديد
              </Button>
            </Link>
          )}
          <Button size="sm" variant="outline" type="button" onClick={() => load()}>
            تحديث
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-sm font-bold text-muted">جاري التحميل...</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm font-bold text-muted">لا توجد طلبات.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-primary">{r.requestNumber}</p>
                    <p className="text-xs font-bold text-muted">
                      {r.clinicName} — {r.requestedByName} — {formatCellValue("createdAt", r.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-primary">
                    {STATUS_AR[r.status] ?? r.status}
                  </span>
                </div>
                <ul className="text-xs font-semibold text-foreground">
                  {r.lines.map((l) => (
                    <li key={l.id}>
                      {l.medicationName}: {l.quantityRequested}
                      {l.quantityApproved != null ? ` (موافق: ${l.quantityApproved})` : ""}
                    </li>
                  ))}
                </ul>
                {canApprove && r.status === "PENDING" && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" type="button" onClick={() => act(r.id, "approve")}>
                      موافقة
                    </Button>
                    <Button size="sm" variant="outline" type="button" onClick={() => act(r.id, "reject")}>
                      رفض
                    </Button>
                  </div>
                )}
                {canApprove && r.status === "APPROVED" && (
                  <Button size="sm" type="button" onClick={() => act(r.id, "fulfill")}>
                    تنفيذ التحويل للعيادة
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
