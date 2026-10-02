import { ok } from "@/lib/api";

/** عام — للـ Docker/Coolify healthcheck (بدون جلسة) */
export async function GET() {
  return ok({ status: "ok", time: new Date().toISOString() });
}
