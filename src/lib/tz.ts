import { formatInTimeZone } from "date-fns-tz";

const TZ = process.env.APP_TIMEZONE ?? "Asia/Kuwait";

export function formatAppDateTime(date: Date | string | number) {
  return formatInTimeZone(new Date(date), TZ, "yyyy-MM-dd HH:mm");
}

export function formatAppDate(date: Date | string | number) {
  return formatInTimeZone(new Date(date), TZ, "yyyy-MM-dd");
}

export { TZ as appTimezone };
