import fs from "fs";
import path from "path";

const root = path.join(import.meta.dirname, "..", "src", "app", "(app)");

const skip = new Set([
  "students/import/page.tsx",
  "referrals/new/page.tsx",
  "qr-generator/page.tsx",
  "print/canteen/page.tsx",
  "students/[id]/page.tsx",
]);

const detailApi = {
  students: "/api/v1/students",
  employees: "/api/v1/employees",
  visits: "/api/v1/visits",
  referrals: "/api/v1/referrals",
  clinics: "/api/v1/settings/clinics",
  medications: "/api/v1/medications",
};

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name === "page.tsx") files.push(p);
  }
  return files;
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function extract(file) {
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes("JSON.stringify(data, null, 2)")) return null;
  const title = src.match(/<h2[^>]*>([^<]+)<\/h2>/)?.[1]?.trim();
  const apiPath = src.match(/fetch\("([^"]+)"\)/)?.[1];
  if (!title || !apiPath) return null;
  return { title, apiPath };
}

function resourceKeyFromRoute(route) {
  const parts = route.split("/").filter(Boolean);
  if (parts[0] === "reports") return "reports";
  if (parts.length >= 2 && LIST_KEYS.has(`${parts[0]}/${parts[1]}`)) {
    return `${parts[0]}/${parts[1]}`;
  }
  return parts[0];
}

const LIST_KEYS = new Set([
  "psychology/sessions",
  "social/cases",
  "internal-referrals",
  "alerts/frequent",
  "canteen/inspections",
  "canteen/incidents",
  "nurses/shifts",
  "nurses/attendance",
  "safety/first-aid",
  "safety/aed",
  "safety/inspections",
]);

function listPage({ title, apiPath, resourceKey, detailBase }) {
  const detail =
    detailBase &&
    `detailHref={(row) => \`${detailBase}/\${String(row.id)}\`}`;
  return `"use client";

import { AutoDataTable } from "@/components/shared/AutoDataTable";
${detailBase ? 'import Link from "next/link";\nimport { Button } from "@/components/ui/button";' : ""}

export default function Page() {
  return (
    <AutoDataTable
      title="${title}"
      apiPath="${apiPath}"
      resourceKey="${resourceKey}"
      ${detail ? `${detail}` : ""}
    />
  );
}
`;
}

function detailPage({ title, apiPath, backHref }) {
  return `"use client";

import { RecordDetailPanel } from "@/components/shared/RecordDetailPanel";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const id = params?.id as string | undefined;
  return (
    <RecordDetailPanel
      title="${title}"
      apiPath="${apiPath}"
      recordId={id}
      backHref="${backHref}"
    />
  );
}
`;
}

let updated = 0;
for (const file of walk(root)) {
  const route = rel(file);
  if (skip.has(route)) continue;
  const meta = extract(file);
  if (!meta) continue;

  const isDetail = route.includes("[id]");
  const isNew = route.includes("/new");

  if (isNew) continue;

  let content;
  if (isDetail) {
    const base = route.split("/[id]")[0];
    const segment = base.split("/")[0];
    const api = detailApi[segment] ?? meta.apiPath;
    content = detailPage({
      title: meta.title,
      apiPath: api,
      backHref: `/${base}`,
    });
  } else {
    const resourceKey = resourceKeyFromRoute(route.replace("/page.tsx", ""));
    const detailBase = ["students", "employees", "visits", "referrals", "clinics"].includes(
      resourceKey.split("/")[0],
    )
      ? `/${resourceKey.split("/")[0]}`
      : null;
    content = listPage({
      title: meta.title,
      apiPath: meta.apiPath,
      resourceKey,
      detailBase,
    });
  }

  fs.writeFileSync(file, content);
  updated++;
}

console.log(`Upgraded ${updated} pages`);
