import type { NextRequest } from "next/server";
import { withActor } from "@/server/api-handler";
import { handleApi } from "@/server/router";
import type { Resource } from "@/lib/rbac";
import { ok } from "@/lib/api";

type RouteCtx = { params: Promise<{ segments?: string[] }> };

function mapResource(pathname: string): Resource {
  if (pathname.includes("/students/import") || pathname.includes("/students/search")) return "students";
  if (pathname.includes("/students")) return "students";
  if (pathname.includes("/employees/recommendations")) return "recommendations";
  if (pathname.includes("/employees")) return "employees";
  if (pathname.includes("/visits")) return "visits";
  if (pathname.includes("/referrals")) return "student_referrals";
  if (pathname.includes("/emergency")) return "emergency";
  if (pathname.includes("/administer")) return "mar";
  if (pathname.includes("/medications")) return "medications";
  if (pathname.includes("/inventory/adjustments")) return "inventory";
  if (pathname.includes("/inventory")) return "inventory";
  if (pathname.includes("/canteen/incidents") || pathname.includes("/canteen/inspections")) return "canteen";
  if (pathname.includes("/psychology")) return "psychology";
  if (pathname.includes("/social")) return "social";
  if (pathname.includes("/internal-referrals")) return "internal_referrals";
  if (pathname.includes("/alerts/frequent")) return "students";
  if (pathname.includes("/notifications")) return "circulars";
  if (pathname.includes("/circulars")) return "circulars";
  if (pathname.includes("/reports")) return "reports";
  if (pathname.includes("/audit-logs")) return "audit_logs";
  if (pathname.includes("/clinics/")) return "settings";
  if (pathname.includes("/settings")) return "settings";
  if (pathname.includes("/search")) return "students";
  if (pathname.endsWith("/health")) return "settings";
  return "settings";
}

function mapAction(method: string, pathname: string): "create" | "read" | "update" | "delete" | "export" | "approve" {
  if (pathname.includes("/decision") || pathname.includes("/adjustments")) return "approve";
  if (pathname.includes("/export")) return "export";
  if (method === "POST" && (pathname.endsWith("/close") || pathname.endsWith("/vitals"))) return "update";
  if (method === "POST") return "create";
  if (method === "PUT" || method === "PATCH") return "update";
  if (method === "DELETE") return "delete";
  return "read";
}

export async function GET(req: NextRequest, ctx: RouteCtx) {
  return withActor(req, mapResource(req.nextUrl.pathname), "read", async (actor, request) =>
    handleApi(request, actor, mapResource(request.nextUrl.pathname), "GET", {
      id: (await ctx.params).segments?.find((s) => s.match(/^[0-9a-f-]{36}$/i)),
    }),
  );
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const pathname = req.nextUrl.pathname;
  const resource = mapResource(pathname);
  const action = mapAction("POST", pathname);
  return withActor(req, resource, action, async (actor, request) =>
    handleApi(request, actor, resource, "POST", {
      id: (await ctx.params).segments?.find((s) => s.match(/^[0-9a-f-]{36}$/i)),
    }),
  );
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const resource = mapResource(req.nextUrl.pathname);
  return withActor(req, resource, "update", async (actor, request) =>
    handleApi(request, actor, resource, "PUT", {
      id: (await ctx.params).segments?.find((s) => s.match(/^[0-9a-f-]{36}$/i)),
    }),
  );
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const resource = mapResource(req.nextUrl.pathname);
  return withActor(req, resource, "update", async (actor, request) =>
    handleApi(request, actor, resource, "PATCH", {
      id: (await ctx.params).segments?.find((s) => s.match(/^[0-9a-f-]{36}$/i)),
    }),
  );
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const resource = mapResource(req.nextUrl.pathname);
  return withActor(req, resource, "delete", async (actor, request) =>
    handleApi(request, actor, resource, "DELETE", {
      id: (await ctx.params).segments?.find((s) => s.match(/^[0-9a-f-]{36}$/i)),
    }),
  );
}
