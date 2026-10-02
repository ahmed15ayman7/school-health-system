import fs from "fs";
import path from "path";

const root = path.join(import.meta.dirname, "..", "src", "app", "api", "v1");

const routes = [
  ["health/route.ts", "GET", "health", "read"],
  ["students/route.ts", "GET,POST", "students", "read,create"],
  ["students/[id]/route.ts", "GET,PUT,DELETE", "students", "read,update,delete"],
  ["students/search/route.ts", "GET", "students", "read"],
  ["students/import/route.ts", "POST", "students", "create"],
  ["employees/route.ts", "GET,POST", "employees", "read,create"],
  ["employees/[id]/route.ts", "GET,PUT", "employees", "read,update"],
  ["employees/recommendations/route.ts", "GET", "recommendations", "read"],
  ["employees/recommendations/[id]/decision/route.ts", "POST", "recommendations", "approve"],
  ["visits/route.ts", "GET,POST", "visits", "read,create"],
  ["visits/stats/route.ts", "GET", "visits", "read"],
  ["visits/[id]/route.ts", "GET,PUT", "visits", "read,update"],
  ["visits/[id]/close/route.ts", "POST", "visits", "update"],
  ["referrals/route.ts", "GET,POST", "student_referrals", "read,create"],
  ["referrals/stats/route.ts", "GET", "student_referrals", "read"],
  ["referrals/[id]/route.ts", "GET", "student_referrals", "read"],
  ["referrals/[id]/receive/route.ts", "POST", "student_referrals", "update"],
  ["referrals/[id]/start-treatment/route.ts", "POST", "student_referrals", "update"],
  ["referrals/[id]/complete/route.ts", "POST", "student_referrals", "update"],
  ["emergency/route.ts", "GET,POST", "emergency", "read,create"],
  ["medications/route.ts", "GET,POST", "medications", "read,create"],
  ["medications/alerts/route.ts", "GET", "medications", "read"],
  ["medications/[id]/administer/route.ts", "POST", "mar", "create"],
  ["inventory/route.ts", "GET", "inventory", "read"],
  ["inventory/transactions/route.ts", "GET,POST", "inventory", "read,create"],
  ["inventory/adjustments/route.ts", "POST", "inventory", "approve"],
  ["canteen/inspections/route.ts", "GET,POST", "canteen", "read,create"],
  ["canteen/incidents/route.ts", "GET,POST", "canteen", "read,create"],
  ["psychology/sessions/route.ts", "GET,POST", "psychology", "read,create"],
  ["social/cases/route.ts", "GET,POST", "social", "read,create"],
  ["internal-referrals/route.ts", "GET,POST", "internal_referrals", "read,create"],
  ["alerts/frequent/route.ts", "GET", "students", "read"],
  ["circulars/route.ts", "GET,POST", "circulars", "read,create"],
  ["notifications/route.ts", "GET", "circulars", "read"],
  ["notifications/[id]/read/route.ts", "PUT", "circulars", "update"],
  ["reports/export/route.ts", "POST", "reports", "export"],
  ["reports/visits/route.ts", "GET", "reports", "read"],
  ["search/route.ts", "GET", "students", "read"],
  ["settings/clinics/route.ts", "GET", "settings", "read"],
  ["settings/users/route.ts", "GET,POST", "settings", "read,create"],
  ["audit-logs/route.ts", "GET", "audit_logs", "read"],
];

function makeHandler(resource, methods) {
  const m = methods.split(",");
  const exports = m
    .map((method) => {
      const actionMap = { GET: "read", POST: "create", PUT: "update", DELETE: "delete" };
      const action = actionMap[method.trim()] ?? "read";
      return `export async function ${method.trim()}(req: NextRequest${method.includes("[") ? ", ctx: { params: Promise<{ id: string }> }" : ""}) {
  return withActor(req, "${resource}", "${action}", async (actor, request) => {
    const { handleApi } = await import("@/server/router");
    return handleApi(request, actor, "${resource}", "${method.trim()}");
  });
}`;
    })
    .join("\n\n");

  return `import type { NextRequest } from "next/server";
import { withActor } from "@/server/api-handler";

${exports}
`;
}

for (const [file, methods, resource] of routes) {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, makeHandler(resource, methods.split(",")[0].includes("GET") ? methods : methods));
}

console.log(`Scaffolded ${routes.length} API route files`);
