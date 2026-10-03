export type ExpiryTier = "ok" | "warn" | "critical" | "expired";

export function expiryTier(expiryDate: Date, now = new Date()): ExpiryTier {
  const ms = expiryDate.getTime() - now.getTime();
  const days = ms / 86400000;
  if (days < 0) return "expired";
  if (days <= 30) return "critical";
  if (days <= 90) return "warn";
  return "ok";
}

export function isDispenseBlocked(expiryDate: Date, now = new Date()): boolean {
  const tier = expiryTier(expiryDate, now);
  return tier === "critical" || tier === "expired";
}
