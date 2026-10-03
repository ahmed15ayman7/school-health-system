import type { NextRequest } from "next/server";
import { fail } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { requireActor, type ActorContext } from "@/server/context";
import type { Action, Resource } from "@/lib/rbac";
import { requirePermission } from "@/lib/rbac";

export async function withActor<T>(
  req: NextRequest,
  resource: Resource,
  action: Action,
  handler: (actor: ActorContext, req: NextRequest) => Promise<Response>,
) {
  try {
    const actor = await requireActor();
    requirePermission(actor.role, resource, action);
    return await handler(actor, req);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    if (msg === "UNAUTHORIZED") return fail("UNAUTHORIZED", "يجب تسجيل الدخول", 401);
    if (msg === "FORBIDDEN") return fail("FORBIDDEN", "ليس لديك صلاحية", 403);
    if (msg === "CLINIC_FORBIDDEN") {
      await writeAudit({
        actionType: "CLINIC_ACCESS_DENIED",
        tableName: resource,
        ipAddress: req.headers.get("x-forwarded-for"),
        userAgent: req.headers.get("user-agent"),
      }).catch(() => undefined);
      return fail("CLINIC_FORBIDDEN", "لا يمكن الوصول لبيانات عيادة أخرى", 403);
    }
    if (msg === "ALLERGY_CONFLICT") return fail("ALLERGY_CONFLICT", "تعارض حساسية — يلزم تجاوز صريح", 409);
    if (msg === "INSUFFICIENT_STOCK") return fail("INSUFFICIENT_STOCK", "مخزون غير كافٍ", 409);
    if (msg === "EXPIRY_BLOCKED") return fail("EXPIRY_BLOCKED", "الصرف موقوف — صلاحية الدفعة أقل من 30 يوم", 409);
    if (msg === "IDEMPOTENCY_REQUIRED") return fail("IDEMPOTENCY_REQUIRED", "Idempotency-Key مطلوب", 400);
    if (msg === "NOT_FOUND") return fail("NOT_FOUND", "السجل غير موجود", 404);
    if (msg === "VALIDATION_ERROR") return fail("VALIDATION_ERROR", "بيانات غير صالحة", 400);
    console.error(e);
    return fail("INTERNAL", "خطأ داخلي", 500);
  }
}
