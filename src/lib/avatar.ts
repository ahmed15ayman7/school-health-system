const AVATAR_RESOURCES = new Set(["students", "employees", "settings", "search"]);

export function resourceShowsAvatar(resourceKey?: string): boolean {
  if (!resourceKey) return false;
  return AVATAR_RESOURCES.has(resourceKey);
}

export function rowDisplayName(row: Record<string, unknown>): string {
  for (const key of ["name", "fullName", "title", "username"]) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "?";
}

export function rowAvatarSeed(row: Record<string, unknown>): string {
  const id = row.id;
  if (typeof id === "string" && id) return id;
  return rowDisplayName(row);
}

/** صورة مرفوعة أو مولّدة ثابتة من الاسم/المعرّف */
export function rowAvatarSrc(row: Record<string, unknown>, resourceKey?: string): string {
  const photo = row.photoUrl ?? row.avatarUrl;
  if (typeof photo === "string" && photo.trim()) return photo.trim();

  const seed = encodeURIComponent(rowAvatarSeed(row));
  const style = resourceKey === "employees" || resourceKey === "settings" ? "initials" : "avataaars";
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundType=gradientLinear&radius=50`;
}

export function rowInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2);
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`;
}
